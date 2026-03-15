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
    type UsageUnit = { serviceId: string | null; activityTime: string | null; quantity: number };
    const usageUnits: UsageUnit[] = [];
    for (const bk of bookings) {
        if (bk.activities.length > 0) {
            for (const act of bk.activities) {
                const actDateStr = new Date(act.activityDate).toISOString().slice(0, 10);
                if (actDateStr !== date) continue;
                usageUnits.push({ serviceId: act.serviceId, activityTime: act.activityTime, quantity: act.quantity ?? 1 });
            }
        } else {
            usageUnits.push({ serviceId: bk.serviceId, activityTime: bk.activityTime, quantity: bk.quantity ?? 1 });
        }
    }

    // Pre-fetch GCal busy maps for all gcalEnabled capacity groups (before the sync map() loop)
    // Key: capacityGroup (or serviceId if no group) → { calendarIds, busyMap }
    const gcalCache = new Map<string, { calendarIds: string[]; busyMap: Map<string, { start: string; end: string }[]> }>();
    for (const svc of services) {
        if (!svc.gcalEnabled) continue;
        const groupKey = svc.capacityGroup ?? svc.id;
        if (gcalCache.has(groupKey)) continue; // already fetched for this group
        const gcalStaff = await prisma.gcalStaff.findMany({
            where: svc.capacityGroup ? { capacityGroup: svc.capacityGroup } : { serviceId: svc.id },
            select: { calendarId: true },
            orderBy: { order: "asc" },
        });
        const calendarIds = gcalStaff.map(s => s.calendarId);
        const busyMap = calendarIds.length > 0 ? await getCachedFreeBusy(calendarIds, date) : new Map();
        gcalCache.set(groupKey, { calendarIds, busyMap });
    }

    const result = services.map((svc) => {
        if (!svc.durationMinutes) return null;

        const closeTime = svc.serviceCloseTime ?? sched.closeTime;
        const slotTimes = generateSlots(sched.openTime, closeTime, {
            durationMinutes: svc.durationMinutes,
            slotGapMinutes: svc.slotGapMinutes,
            unitCapacity: svc.unitCapacity,
            capacityGroup: svc.capacityGroup,
        });

        const relevantUnits = usageUnits.filter((u) =>
            u.serviceId === svc.id ||
            (svc.capacityGroup && services.find((s) => s.id === u.serviceId)?.capacityGroup === svc.capacityGroup)
        );

        const gcalGroup = gcalCache.get(svc.capacityGroup ?? svc.id);
        const gcalCalendarIds = gcalGroup?.calendarIds ?? [];
        const gcalBusyMap = gcalGroup?.busyMap ?? new Map();

        const slots = slotTimes.map((slotTime) => {
            const slotStart = timeToMinutes(slotTime);

            let crmUsed = 0;
            for (const u of relevantUnits) {
                if (!u.activityTime) continue;
                const bkStart = timeToMinutes(u.activityTime);
                const bkDuration = services.find(s => s.id === u.serviceId)?.durationMinutes ?? svc.durationMinutes!;
                if (timesOverlap(slotStart, svc.durationMinutes!, bkStart, bkDuration)) {
                    crmUsed += u.quantity;
                }
            }

            let gcalUsed = 0;
            if (gcalCalendarIds.length > 0) {
                const { startISO, endISO } = toGcalTimes(date, slotTime, svc.durationMinutes!);
                const slotStartMs = new Date(startISO).getTime();
                const slotEndMs = new Date(endISO).getTime();
                const checkStartMs = slotStartMs - Math.max(0, svc.slotGapMinutes ?? 10) * 60_000;
                for (const calId of gcalCalendarIds) {
                    const busy = gcalBusyMap.get(calId) ?? [];
                    if (busy.some((b: { start: string; end: string }) => new Date(b.start).getTime() < slotEndMs && new Date(b.end).getTime() > checkStartMs)) {
                        gcalUsed++;
                    }
                }
            }

            const used = gcalCalendarIds.length > 0 ? Math.max(crmUsed, gcalUsed) : crmUsed;
            const available = Math.max(0, svc.unitCapacity - used);
            return { time: slotTime, available, capacity: svc.unitCapacity, blocked: available === 0 };
        });

        return { id: svc.id, name: svc.name, variant: svc.variant, category: svc.category, price: svc.price, durationMinutes: svc.durationMinutes, minPax: svc.minPax, maxPax: svc.maxPax, slots };
    }).filter(Boolean);

    return NextResponse.json({ closed: false, openTime: sched.openTime, closeTime: sched.closeTime, services: result });
}
