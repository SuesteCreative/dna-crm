import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateSlots, timeToMinutes, timesOverlap } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isStaff = role === "SUPER_ADMIN" || role === "ADMIN" || role === undefined || role === null;
    // Partners can also check slots but cannot override

    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date"); // "YYYY-MM-DD"
    const quantity = parseInt(searchParams.get("quantity") || "1", 10);

    if (!serviceId || !date) {
        return NextResponse.json({ error: "serviceId and date required" }, { status: 400 });
    }

    const prisma = await getPrisma();

    // Load service config
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.durationMinutes) {
        return NextResponse.json({ error: "Service not found or has no duration" }, { status: 404 });
    }

    // Load schedule for the day of week
    const dateObj = new Date(date + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    const schedule = await prisma.schedule.findUnique({ where: { dayOfWeek } });
    if (!schedule || !schedule.isOpen) {
        return NextResponse.json({ slots: [], closed: true });
    }

    // Generate all possible slots
    const slotTimes = generateSlots(schedule.openTime, schedule.closeTime, {
        durationMinutes: service.durationMinutes,
        slotGapMinutes: service.slotGapMinutes ?? 10,
        unitCapacity: service.unitCapacity ?? 1,
        capacityGroup: service.capacityGroup,
    });

    // Load existing bookings for this date that are not cancelled
    // If capacityGroup exists, aggregate across all services in the group
    let bookedServices: { id: string; durationMinutes: number | null; slotGapMinutes: number; unitCapacity: number }[] = [];
    if (service.capacityGroup) {
        const groupServices = await prisma.service.findMany({
            where: { capacityGroup: service.capacityGroup },
            select: { id: true, durationMinutes: true, slotGapMinutes: true, unitCapacity: true },
        });
        bookedServices = groupServices;
    } else {
        bookedServices = [{ id: service.id, durationMinutes: service.durationMinutes, slotGapMinutes: service.slotGapMinutes ?? 10, unitCapacity: service.unitCapacity ?? 1 }];
    }

    const serviceIds = bookedServices.map(s => s.id);

    const startOfDay = new Date(date + "T00:00:00.000Z");
    const endOfDay = new Date(date + "T23:59:59.999Z");

    const existingBookings = await prisma.booking.findMany({
        where: {
            serviceId: { in: serviceIds },
            activityDate: { gte: startOfDay, lte: endOfDay },
            status: { not: "CANCELLED" },
        },
        select: { activityTime: true, quantity: true, serviceId: true },
    });

    const totalCapacity = service.unitCapacity ?? 1;

    // For each slot, compute how many units are already booked (overlapping)
    const slotResults = slotTimes.map((slotTime) => {
        const slotStart = timeToMinutes(slotTime);
        const slotDuration = service.durationMinutes!;

        let usedCapacity = 0;
        for (const booking of existingBookings) {
            if (!booking.activityTime) continue;
            const bookingStart = timeToMinutes(booking.activityTime);
            // Find the duration for this booking's service
            const bService = bookedServices.find(s => s.id === booking.serviceId);
            const bDuration = bService?.durationMinutes ?? slotDuration;

            if (timesOverlap(slotStart, slotDuration, bookingStart, bDuration)) {
                usedCapacity += booking.quantity ?? 1;
            }
        }

        const available = Math.max(0, totalCapacity - usedCapacity);
        return {
            time: slotTime,
            available,
            capacity: totalCapacity,
            blocked: available < quantity,
        };
    });

    return NextResponse.json({
        slots: slotResults,
        closed: false,
        canOverride: role === "SUPER_ADMIN" || role === "ADMIN" || (!role), // staff can override, partners cannot
    });
}
