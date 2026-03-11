import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { deleteBusyEvent } from "@/lib/gcal";
import { logAudit } from "@/lib/audit";
import { timeToMinutes, timesOverlap } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const prisma = await getPrisma();
        const data = await req.json();
        const { id, override, overrideReason, userName, ...fields } = data;

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const current = await prisma.booking.findUnique({ where: { id } });
        if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { sessionClaims } = await auth();
        const role = (sessionClaims as any)?.metadata?.role as string | undefined;
        const isPartner = role === "PARTNER";

        // Effective values for capacity check
        const effSvcId = fields.serviceId || current.serviceId;
        const effDate = fields.activityDate || current.activityDate;
        const effTime = fields.activityTime || current.activityTime;
        const effQty = fields.quantity !== undefined ? parseInt(fields.quantity) : (current.quantity || 1);
        const effPax = fields.pax !== undefined ? parseInt(fields.pax) : (current.pax || 1);
        const effStatus = fields.status || current.status;

        // Skip check if cancelled or no time/service/date
        if (effStatus !== "CANCELLED" && effSvcId && effTime && effDate) {
            const service = await prisma.service.findUnique({ where: { id: effSvcId } });

            if (service?.durationMinutes) {
                let serviceIds: string[] = [effSvcId];
                if (service.capacityGroup) {
                    const groupServices = await prisma.service.findMany({
                        where: { capacityGroup: service.capacityGroup },
                        select: { id: true },
                    });
                    serviceIds = groupServices.map(s => s.id);
                }

                const dateObj = new Date(effDate);
                const startOfDay = new Date(dateObj.toISOString().split("T")[0] + "T00:00:00.000Z");
                const endOfDay = new Date(dateObj.toISOString().split("T")[0] + "T23:59:59.999Z");

                const existingBookings = await prisma.booking.findMany({
                    where: {
                        id: { not: id }, // EXCLUDE SELF
                        serviceId: { in: serviceIds },
                        activityDate: { gte: startOfDay, lte: endOfDay },
                        status: { not: "CANCELLED" },
                    },
                    select: { activityTime: true, quantity: true, serviceId: true },
                });

                const allServices = await prisma.service.findMany({ select: { id: true, durationMinutes: true } });
                const slotStart = timeToMinutes(effTime);
                let usedCapacity = 0;
                for (const b of existingBookings) {
                    if (!b.activityTime) continue;
                    const bStart = timeToMinutes(b.activityTime);
                    const bService = allServices.find(s => s.id === b.serviceId);
                    const bDuration = bService?.durationMinutes ?? service.durationMinutes;

                    if (timesOverlap(slotStart, service.durationMinutes, bStart, bDuration)) {
                        usedCapacity += b.quantity ?? 1;
                    }
                }

                const requestedQty = effQty || effPax || 1;
                const totalCapacity = service.unitCapacity ?? 1;
                const available = totalCapacity - usedCapacity;

                if (available < requestedQty) {
                    if (isPartner) {
                        return NextResponse.json({ error: "SLOT_FULL", available, capacity: totalCapacity }, { status: 409 });
                    }
                    if (!override) {
                        return NextResponse.json({ error: "SLOT_FULL", available, capacity: totalCapacity, canOverride: true }, { status: 409 });
                    }
                }

                if (override && overrideReason && !isPartner) {
                    await prisma.overrideLog.create({
                        data: {
                            bookingId: id,
                            clerkUserId: userId,
                            userName: userName || "Unknown",
                            reason: overrideReason,
                            serviceId: effSvcId,
                            serviceName: service.variant ? `${service.name} - ${service.variant}` : service.name,
                            slotTime: effTime,
                            date: dateObj.toISOString().split("T")[0],
                        },
                    });
                }
            }
        }

        // If status is being set to CANCELLED and booking has GCal events, delete them
        if (fields.status === "CANCELLED" && current.gcalEventIds && current.gcalCalendarIds) {
            try {
                const eventIds: string[] = JSON.parse(current.gcalEventIds);
                const calendarIds: string[] = JSON.parse(current.gcalCalendarIds);
                for (let i = 0; i < eventIds.length; i++) {
                    await deleteBusyEvent(calendarIds[i], eventIds[i]);
                }
            } catch (gcalErr) {
                console.error("gcal cancel-delete failed (non-blocking):", gcalErr);
            }
        }

        // Only capture originals on the very first edit
        const captureOriginals = !current.isEdited;

        const booking = await prisma.booking.update({
            where: { id },
            data: {
                customerName: fields.customerName,
                customerEmail: fields.customerEmail || null,
                customerPhone: fields.customerPhone || null,
                activityDate: fields.activityDate ? new Date(fields.activityDate) : undefined,
                activityTime: fields.activityTime || null,
                pax: fields.pax ? parseInt(fields.pax) : undefined,
                quantity: fields.quantity ? parseInt(fields.quantity) : undefined,
                totalPrice: fields.totalPrice !== undefined ? parseFloat(fields.totalPrice) || 0 : undefined,
                activityType: fields.activityType || null,
                status: fields.status || undefined,
                notes: fields.notes || null,
                country: fields.countryCode === undefined ? undefined : (fields.countryCode || "Other"),
                bookingFee: fields.bookingFee !== undefined ? parseFloat(fields.bookingFee) || 0 : undefined,
                isEdited: true,
                ...(fields.status === "CANCELLED" && {
                    gcalEventIds: null,
                    gcalCalendarIds: null,
                }),
                ...(captureOriginals && {
                    originalActivityType: current.activityType,
                    originalPax: current.pax,
                    originalQuantity: current.quantity,
                    originalTotalPrice: current.totalPrice,
                    originalActivityDate: current.activityDate,
                    originalActivityTime: current.activityTime,
                }),
            } as any,
        });

        await logAudit({
            userId,
            action: fields.status === "CANCELLED" ? "CANCEL" : "UPDATE",
            module: "DASHBOARD",
            targetId: booking.id,
            targetName: booking.customerName,
            details: {
                changes: fields,
            },
        });

        return NextResponse.json(booking);
    } catch (err: any) {
        console.error("Failed to update booking:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
