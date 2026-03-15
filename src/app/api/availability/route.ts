import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { generateSlots, timeToMinutes, timesOverlap } from "@/lib/slots";
import { getCachedFreeBusy } from "@/lib/gcal-cache";
import { toGcalTimes } from "@/lib/gcal";

export const dynamic = "force-dynamic";

// GET /api/availability?date=2026-03-15
// Returns all active services with their slots + remaining capacity for the given date.
export async function GET(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const date = new URL(req.url).searchParams.get("date");
    if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

    const prisma = await getPrisma();

    // Load schedule for day-of-week
    const d = new Date(date + "T12:00:00Z");
    const dow = d.getUTCDay();
    const schedules = await prisma.schedule.findMany({ orderBy: { dayOfWeek: "asc" } });
    const sched = schedules.find((s) => s.dayOfWeek === dow);
    if (!sched || !sched.isOpen) {
        return NextResponse.json({ closed: true, services: [] });
    }

    const services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // All bookings for this date (confirmed/pending, not soft-deleted), including their sub-activities
    const bookings = await prisma.booking.findMany({
        where: {
            activityDate: { gte: new Date(date + "T00:00:00Z"), lte: new Date(date + "T23:59:59Z") },
            status: { in: ["CONFIRMED", "PENDING"] },
            deletedAt: null,
        },
        include: { activities: true },
    });

    // Flatten into a unified list of "usage units" — each entry has serviceId, activityTime, quantity
    // For multi-activity bookings use the BookingActivity rows; for single/Shopify use the parent.
    type UsageUnit = { serviceId: string | null; activityTime: string | null; quantity: number };
    const usageUnits: UsageUnit[] = [];
    for (const bk of bookings) {
        if (bk.activities.length > 0) {
            // Multi-activity booking — each activity contributes independently
            for (const act of bk.activities) {
                const actDate = new Date(act.activityDate);
                const actDateStr = actDate.toISOString().slice(0, 10);
                if (actDateStr !== date) continue; // activity on a different date
                usageUnits.push({
                    serviceId: act.serviceId,
                    activityTime: act.activityTime,
                    quantity: act.quantity ?? 1,
                });
            }
        } else {
            // Single-activity / Shopify booking — use the parent record
            usageUnits.push({
                serviceId: bk.serviceId,
                activityTime: bk.activityTime,
                quantity: bk.quantity ?? 1,
            });
        }
    }

    // Build capacity-group usage map: groupKey -> Map<slotTime, usedCapacity>
    const groupUsage = new Map<string, Map<string, number>>();

    const result = services.map((svc) => {
        if (!svc.durationMinutes) return null; // skip non-slotted services

        const closeTime = svc.serviceCloseTime ?? sched.closeTime;
        const slotTimes = generateSlots(sched.openTime, closeTime, {
            durationMinutes: svc.durationMinutes,
            slotGapMinutes: svc.slotGapMinutes,
            unitCapacity: svc.unitCapacity,
            capacityGroup: svc.capacityGroup,
        });

        const groupKey = svc.capacityGroup ?? svc.id;
        if (!groupUsage.has(groupKey)) {
            groupUsage.set(groupKey, new Map());
        }

        // Filter usage units relevant to this service / capacity group
        const relevantUnits = usageUnits.filter((u) =>
            u.serviceId === svc.id ||
            (svc.capacityGroup && services.find((s) => s.id === u.serviceId)?.capacityGroup === svc.capacityGroup)
        );

        // Load GCal busy map for this service's capacity group (once per service)
        let gcalBusyMap: Map<string, { start: string; end: string }[]> = new Map();
        let gcalCalendarIds: string[] = [];
        if (svc.gcalEnabled) {
            const gcalStaff = await prisma.gcalStaff.findMany({
                where: svc.capacityGroup
                    ? { capacityGroup: svc.capacityGroup }
                    : { serviceId: svc.id },
                select: { calendarId: true },
                orderBy: { order: "asc" },
            });
            gcalCalendarIds = gcalStaff.map(s => s.calendarId);
            if (gcalCalendarIds.length > 0) {
                gcalBusyMap = await getCachedFreeBusy(gcalCalendarIds, date);
            }
        }

        const slots = slotTimes.map((slotTime) => {
            const slotStart = timeToMinutes(slotTime);

            // CRM-based usage
            let crmUsed = 0;
            for (const u of relevantUnits) {
                if (!u.activityTime) continue;
                const bkStart = timeToMinutes(u.activityTime);
                const bkService = services.find(s => s.id === u.serviceId);
                const bkDuration = bkService?.durationMinutes ?? svc.durationMinutes!;
                if (timesOverlap(slotStart, svc.durationMinutes!, bkStart, bkDuration)) {
                    crmUsed += u.quantity;
                }
            }

            // GCal-based usage (Meety bookings)
            let gcalUsed = 0;
            if (gcalCalendarIds.length > 0) {
                const { startISO, endISO } = toGcalTimes(date, slotTime, svc.durationMinutes!);
                const slotStartMs = new Date(startISO).getTime();
                const slotEndMs = new Date(endISO).getTime();
                const bufferMins = Math.max(0, svc.slotGapMinutes ?? 10);
                const checkStartMs = slotStartMs - bufferMins * 60_000;
                for (const calId of gcalCalendarIds) {
                    const busy = gcalBusyMap.get(calId) ?? [];
                    const isBusy = busy.some(b =>
                        new Date(b.start).getTime() < slotEndMs &&
                        new Date(b.end).getTime() > checkStartMs
                    );
                    if (isBusy) gcalUsed++;
                }
            }

            const used = gcalCalendarIds.length > 0 ? Math.max(crmUsed, gcalUsed) : crmUsed;
            const capacity = svc.unitCapacity;
            const available = Math.max(0, capacity - used);
            return { time: slotTime, available, capacity, blocked: available === 0 };
        });

        return {
            id: svc.id,
            name: svc.name,
            variant: svc.variant,
            category: svc.category,
            price: svc.price,
            durationMinutes: svc.durationMinutes,
            minPax: svc.minPax,
            maxPax: svc.maxPax,
            slots,
        };
    }).filter(Boolean);

    return NextResponse.json({ closed: false, openTime: sched.openTime, closeTime: sched.closeTime, services: result });
}
