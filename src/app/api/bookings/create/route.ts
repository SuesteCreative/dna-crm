import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { timeToMinutes, timesOverlap } from "@/lib/slots";
import { createBusyEvent, toGcalTimes } from "@/lib/gcal";
import { logAudit } from "@/lib/audit";
import { sendBookingQRCode } from "@/lib/email";

// Deployment update: 2026-03-11 08:48
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isPartner = role === "PARTNER";

    // Read partnerId directly from Clerk (bypasses JWT template/caching limitations)
    let sessionPartnerId: string | undefined;
    if (isPartner) {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        sessionPartnerId = clerkUser.publicMetadata?.partnerId as string | undefined;
    }

    try {
        const prisma = await getPrisma();
        const data = await req.json();

        const {
            customerName,
            customerEmail,
            customerPhone,
            activityDate,
            activityTime,
            pax,
            totalPrice,
            serviceId,
            activityType,
            quantity,
            override,
            overrideReason,
            userName,
            forPartnerId,
            countryCode,
            bookingFee,
        } = data;

        // Admins can pass forPartnerId to book on behalf of a partner
        const adminPartnerId = !isPartner && forPartnerId ? forPartnerId : null;

        // Capacity check if service + time are provided
        if (serviceId && activityTime && activityDate) {
            const service = await prisma.service.findUnique({ where: { id: serviceId } });

            if (service?.durationMinutes) {
                // Find all services in the same capacity group (or just this service)
                let serviceIds: string[] = [serviceId];
                if (service.capacityGroup) {
                    const groupServices = await prisma.service.findMany({
                        where: { capacityGroup: service.capacityGroup },
                        select: { id: true },
                    });
                    serviceIds = groupServices.map(s => s.id);
                }

                const dateObj = new Date(activityDate);
                const startOfDay = new Date(dateObj.toISOString().split("T")[0] + "T00:00:00.000Z");
                const endOfDay = new Date(dateObj.toISOString().split("T")[0] + "T23:59:59.999Z");

                const existingBookings = await prisma.booking.findMany({
                    where: {
                        serviceId: { in: serviceIds },
                        activityDate: { gte: startOfDay, lte: endOfDay },
                        status: { not: "CANCELLED" },
                    },
                    select: { activityTime: true, quantity: true, serviceId: true },
                });

                const slotStart = timeToMinutes(activityTime);
                let usedCapacity = 0;
                for (const b of existingBookings) {
                    if (!b.activityTime) continue;
                    const bStart = timeToMinutes(b.activityTime);
                    if (timesOverlap(slotStart, service.durationMinutes, bStart, service.durationMinutes)) {
                        usedCapacity += b.quantity ?? 1;
                    }
                }

                const requestedQty = parseInt(quantity) || parseInt(pax) || 1;
                const totalCapacity = service.unitCapacity ?? 1;
                const available = totalCapacity - usedCapacity;

                if (available < requestedQty) {
                    // Partners are hard blocked
                    if (isPartner) {
                        return NextResponse.json(
                            { error: "SLOT_FULL", available, capacity: totalCapacity },
                            { status: 409 }
                        );
                    }
                    // Staff: require explicit override
                    if (!override) {
                        return NextResponse.json(
                            { error: "SLOT_FULL", available, capacity: totalCapacity, canOverride: true },
                            { status: 409 }
                        );
                    }
                }

                // Log override if used
                if (override && overrideReason && !isPartner) {
                    await prisma.overrideLog.create({
                        data: {
                            bookingId: "pending", // will update below
                            clerkUserId: userId,
                            userName: userName || "Unknown",
                            reason: overrideReason,
                            serviceId: service.id,
                            serviceName: service.variant ? `${service.name} - ${service.variant}` : service.name,
                            slotTime: activityTime,
                            date: dateObj.toISOString().split("T")[0],
                        },
                    });
                }
            }
        }

        const booking = await prisma.booking.create({
            data: {
                customerName,
                customerEmail: customerEmail || null,
                customerPhone: customerPhone || null,
                activityDate: new Date(activityDate),
                activityTime: activityTime || null,
                pax: parseInt(pax) || 1,
                quantity: parseInt(quantity) || parseInt(pax) || 1,
                totalPrice: parseFloat(totalPrice || 0),
                createdById: userId,
                source: isPartner || adminPartnerId ? "PARTNER" : "MANUAL",
                status: "CONFIRMED",
                serviceId: serviceId || null,
                activityType: activityType || null,
                partnerId: isPartner ? (sessionPartnerId || null) : adminPartnerId,
                country: countryCode || "Other",
                bookingFee: parseFloat(bookingFee || 0),
            },
            include: { partner: true },
        });

        await logAudit({
            userId,
            userName,
            action: "CREATE",
            module: "DASHBOARD",
            targetId: booking.id,
            targetName: booking.customerName,
            details: {
                serviceId,
                activityDate,
                activityTime,
                quantity: booking.quantity,
                totalPrice: booking.totalPrice,
                override,
                isPartner,
                adminPartnerId,
                bookingFee,
            },
        });

        // Generate and send QR code via email (non-blocking)
        if (booking.customerEmail) {
            sendBookingQRCode(booking).catch(err =>
                console.error("Failed to send QR code email background:", err)
            );
        }

        // Update override log with real booking id
        if (override && overrideReason && !isPartner && serviceId && activityTime) {
            await prisma.overrideLog.updateMany({
                where: {
                    clerkUserId: userId,
                    bookingId: "pending",
                    slotTime: activityTime,
                },
                data: { bookingId: booking.id },
            });
        }

        // Push to Google Calendar if service has gcalEnabled
        if (serviceId && activityTime && activityDate) {
            try {
                const svc = await prisma.service.findUnique({ where: { id: serviceId } });
                if (svc?.gcalEnabled && svc.durationMinutes) {
                    const staffList = await prisma.gcalStaff.findMany({
                        where: { serviceId },
                        orderBy: { order: "asc" },
                    });
                    const requestedQty = parseInt(quantity) || parseInt(pax) || 1;
                    const toBook = staffList.slice(0, requestedQty);
                    if (toBook.length > 0) {
                        const dateStr = new Date(activityDate).toISOString().split("T")[0];
                        const { startISO, endISO } = toGcalTimes(dateStr, activityTime, svc.durationMinutes);
                        const summary = `CRM Booking - ${customerName}`;
                        const eventIds: string[] = [];
                        const calendarIds: string[] = [];
                        for (const staff of toBook) {
                            const eventId = await createBusyEvent(staff.calendarId, startISO, endISO, summary);
                            if (eventId) {
                                eventIds.push(eventId);
                                calendarIds.push(staff.calendarId);
                            }
                        }
                        if (eventIds.length > 0) {
                            await prisma.booking.update({
                                where: { id: booking.id },
                                data: {
                                    gcalEventIds: JSON.stringify(eventIds),
                                    gcalCalendarIds: JSON.stringify(calendarIds),
                                },
                            });
                        }
                    }
                }
            } catch (gcalErr) {
                console.error("gcal push failed (non-blocking):", gcalErr);
            }
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Failed to create booking:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
