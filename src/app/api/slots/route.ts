import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateSlots, timeToMinutes, timesOverlap } from "@/lib/slots";
import { getFreeBusy, toGcalTimes } from "@/lib/gcal";
import { getCachedFreeBusy } from "@/lib/gcal-cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isPartner = role === "PARTNER";

    // Portugal local date/time (handles DST automatically)
    const nowUtc = new Date();
    const ptDateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(nowUtc);
    const ptTimeStr = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(nowUtc);
    const [ptH, ptM] = ptTimeStr.split(":").map(Number);
    const ptNowMinutes = ptH * 60 + ptM;

    const { searchParams } = new URL(req.url);
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date"); // "YYYY-MM-DD"
    const quantity = parseInt(searchParams.get("quantity") || "1", 10);
    const excludeBookingId = searchParams.get("excludeBookingId");

    if (!serviceId || !date) {
        return NextResponse.json({ error: "serviceId and date required" }, { status: 400 });
    }

    // Partners cannot book past dates
    if (isPartner && date < ptDateStr) {
        return NextResponse.json({ slots: [], closed: true, pastDate: true });
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

    // Generate all possible slots — use per-service close time if configured
    const closeTime = service.serviceCloseTime ?? schedule.closeTime;
    const slotTimes = generateSlots(schedule.openTime, closeTime, {
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
            ...(excludeBookingId && { id: { not: excludeBookingId } }),
        },
        select: { activityTime: true, quantity: true, serviceId: true },
    });

    const totalCapacity = service.unitCapacity ?? 1;

    // If gcalEnabled, fetch real-time busy periods from Google Calendar (includes Meety bookings)
    let gcalBusyMap: Map<string, { start: string; end: string }[]> = new Map();
    let gcalStaffIds: string[] = [];
    if (service.gcalEnabled) {
        const gcalStaff = await prisma.gcalStaff.findMany({
            where: { serviceId: service.id },
            select: { calendarId: true },
            orderBy: { order: "asc" },
        });
        gcalStaffIds = gcalStaff.map(s => s.calendarId);
        if (gcalStaffIds.length > 0) {
            // Using local cache for zero-latency
            gcalBusyMap = await getCachedFreeBusy(gcalStaffIds, date);
        }
    }

    // For each slot, compute how many units are already booked (overlapping)
    const slotResults = slotTimes.map((slotTime) => {
        const slotStart = timeToMinutes(slotTime);
        const slotDuration = service.durationMinutes!;

        // CRM-based count (bookings in DB)
        let crmUsed = 0;
        for (const booking of existingBookings) {
            if (!booking.activityTime) continue;
            const bookingStart = timeToMinutes(booking.activityTime);
            const bService = bookedServices.find(s => s.id === booking.serviceId);
            const bDuration = bService?.durationMinutes ?? slotDuration;
            if (timesOverlap(slotStart, slotDuration, bookingStart, bDuration)) {
                crmUsed += booking.quantity ?? 1;
            }
        }

        // GCal-based count (Meety bookings + CRM bookings reflected in calendars)
        let gcalUsed = 0;
        if (gcalStaffIds.length > 0) {
            const { startISO, endISO } = toGcalTimes(date, slotTime, slotDuration);
            const slotStartMs = new Date(startISO).getTime();
            const slotEndMs = new Date(endISO).getTime();
            for (const calId of gcalStaffIds) {
                const busy = gcalBusyMap.get(calId) ?? [];
                const isBusy = busy.some(b =>
                    new Date(b.start).getTime() < slotEndMs &&
                    new Date(b.end).getTime() > slotStartMs
                );
                if (isBusy) gcalUsed++;
            }
        }

        // Use GCal count when available (it includes Meety), otherwise fall back to CRM count
        const usedCapacity = gcalStaffIds.length > 0 ? Math.max(crmUsed, gcalUsed) : crmUsed;
        const available = Math.max(0, totalCapacity - usedCapacity);
        return {
            time: slotTime,
            available,
            capacity: totalCapacity,
            blocked: available < quantity,
        };
    });

    // For partners on today: mark slots in the past as blocked
    const finalSlots = (isPartner && date === ptDateStr)
        ? slotResults.map(slot => {
            const slotMinutes = timeToMinutes(slot.time);
            if (slotMinutes < ptNowMinutes) {
                return { ...slot, blocked: true, past: true };
            }
            return slot;
        })
        : slotResults;

    return NextResponse.json({
        slots: finalSlots,
        closed: false,
        canOverride: role === "SUPER_ADMIN" || role === "ADMIN" || (!role), // staff can override, partners cannot
    });
}
