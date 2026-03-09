import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { generateSlots, timeToMinutes, timesOverlap } from "@/lib/slots";

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

    // All bookings for this date (confirmed/pending, not cancelled/no-show)
    const bookings = await prisma.booking.findMany({
        where: {
            activityDate: { gte: new Date(date + "T00:00:00Z"), lte: new Date(date + "T23:59:59Z") },
            status: { in: ["CONFIRMED", "PENDING"] },
        },
    });

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
        const usage = groupUsage.get(groupKey)!;

        // Calculate usage per slot from bookings
        const relevantBookings = bookings.filter((b) =>
            b.serviceId === svc.id ||
            (svc.capacityGroup && services.find((s) => s.id === b.serviceId)?.capacityGroup === svc.capacityGroup)
        );

        const slots = slotTimes.map((slotTime) => {
            const slotStart = timeToMinutes(slotTime);

            // Count pax/quantity already booked in overlapping slots
            let used = 0;
            for (const bk of relevantBookings) {
                if (!bk.activityTime) continue;
                const bkStart = timeToMinutes(bk.activityTime);
                const bkDuration = svc.durationMinutes!;
                if (timesOverlap(slotStart, svc.durationMinutes!, bkStart, bkDuration)) {
                    used += (bk.pax ?? 1);
                }
            }

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
