import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { timeToMinutes, timesOverlap } from "@/lib/slots";
import { createBusyEvent, toGcalTimes } from "@/lib/gcal";
import { logAudit } from "@/lib/audit";
import { sendBookingQRCode } from "@/lib/email";
import { ensureCustomer } from "@/lib/customers";

// Deployment update: 2026-03-11 08:48
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    const metadata = clerkUser.publicMetadata as any;
    const sessionPartnerId = metadata.partnerId as string | undefined;

    // Use sessionPartnerId as primary signal instead of just role string
    const isPartner = !!sessionPartnerId || role === "PARTNER";

    try {
        const prisma = await getPrisma();
        const data = await req.json();

        const {
            customerName,
            customerEmail,
            customerPhone,
            totalPrice,
            notes,
            override,
            overrideReason,
            userName,
            forPartnerId,
            countryCode,
            bookingFee,
            discountAmount,
            discountType,
            activities: activitiesData,
        } = data;

        // Backward compatibility: if activities array is missing, use root fields
        let activities = activitiesData || [];
        if (activities.length === 0 && data.activityDate) {
            activities = [{
                serviceId: data.serviceId,
                activityDate: data.activityDate,
                activityTime: data.activityTime,
                pax: data.pax,
                quantity: data.quantity,
                totalPrice: data.totalPrice,
                activityType: data.activityType,
            }];
        }

        if (activities.length === 0) {
            return NextResponse.json({ error: "No activities provided" }, { status: 400 });
        }

        // Validate discount
        const rawDiscount = parseFloat(discountAmount || 0);
        if (rawDiscount < 0) {
            return NextResponse.json({ error: "Invalid discountAmount" }, { status: 400 });
        }
        if ((discountType === "%" || !discountType) && rawDiscount > 100) {
            return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
        }

        // Admins can pass forPartnerId to book on behalf of a partner
        const adminPartnerId = !isPartner && forPartnerId ? forPartnerId : null;

        // CAPACITY CHECK LOOP
        for (const act of activities) {
            const { serviceId, activityTime, activityDate, quantity, pax } = act;
            if (serviceId && activityTime && activityDate) {
                const service = await prisma.service.findUnique({ where: { id: serviceId } });

                if (service?.durationMinutes) {
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

                    const existingBookings = await prisma.bookingActivity.findMany({
                        where: {
                            serviceId: { in: serviceIds },
                            activityDate: { gte: startOfDay, lte: endOfDay },
                            booking: { status: { not: "CANCELLED" }, deletedAt: null }
                        },
                        select: { activityTime: true, quantity: true, serviceId: true },
                    });

                    const allServices = await prisma.service.findMany({ select: { id: true, durationMinutes: true } });
                    const slotStart = timeToMinutes(activityTime);
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

                    const requestedQty = parseInt(quantity as any) || parseInt(pax as any) || 1;
                    const totalCapacity = service.unitCapacity ?? 1;
                    const available = totalCapacity - usedCapacity;

                    if (available < requestedQty) {
                        if (isPartner) {
                            return NextResponse.json({ error: "SLOT_FULL", activity: act.activityType, available, capacity: totalCapacity }, { status: 409 });
                        }
                        if (!override) {
                            return NextResponse.json({ error: "SLOT_FULL", activity: act.activityType, available, capacity: totalCapacity, canOverride: true }, { status: 409 });
                        }
                    }
                }
            }
        }

        // Link to centralized customer
        const customerId = await ensureCustomer({
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            country: countryCode,
        });

        // Use info from first activity for root Booking fields (compatibility/sorting)
        const firstAct = activities[0];
        const rawSum = activities.reduce((sum: number, a: any) => sum + (parseFloat(a.totalPrice as any) || 0), 0);
        const discAmt = parseFloat(discountAmount || 0);
        let calculatedTotal = rawSum;
        if (discAmt > 0) {
            calculatedTotal = (discountType === "%") ? rawSum * (1 - discAmt / 100) : rawSum - discAmt;
        }

        const booking = await prisma.booking.create({
            data: {
                customerName,
                customerEmail: customerEmail || null,
                customerPhone: customerPhone || null,
                activityDate: new Date(firstAct.activityDate),
                activityTime: firstAct.activityTime || null,
                pax: parseInt(firstAct.pax as any) || 1,
                quantity: parseInt(firstAct.quantity as any) || parseInt(firstAct.pax as any) || 1,
                totalPrice: parseFloat(totalPrice || 0) > 0 ? parseFloat(totalPrice || 0) : Math.max(0, calculatedTotal),
                notes: notes || null,
                createdById: userId,
                source: isPartner || adminPartnerId ? "PARTNER" : "MANUAL",
                status: "CONFIRMED",
                serviceId: firstAct.serviceId || null,
                activityType: firstAct.activityType || null,
                partnerId: isPartner ? (sessionPartnerId || null) : adminPartnerId,
                country: countryCode || "Other",
                discountAmount: parseFloat(discountAmount || 0),
                discountType: discountType || "%",
                bookingFee: parseFloat(bookingFee || 0),
                customerId,
                activities: {
                    create: activities.map((act: any) => ({
                        serviceId: act.serviceId,
                        activityType: act.activityType,
                        activityDate: new Date(act.activityDate),
                        activityTime: act.activityTime,
                        pax: parseInt(act.pax as any) || 1,
                        quantity: parseInt(act.quantity as any) || parseInt(act.pax as any) || 1,
                        totalPrice: parseFloat(act.totalPrice || 0),
                    }))
                }
            },
            include: { partner: true, activities: true },
        });

        await logAudit({
            userId,
            userName,
            action: "CREATE",
            module: "DASHBOARD",
            targetId: booking.id,
            targetName: booking.customerName,
            details: {
                totalPrice: booking.totalPrice,
                activitiesCount: activities.length,
                isPartner,
                adminPartnerId,
                bookingFee,
            },
        });

        // Email & Override Logging (simplified for multi-activity)
        if (booking.customerEmail) {
            sendBookingQRCode(booking).catch(err => console.error("Email failed:", err));
        }

        if (override && overrideReason && !isPartner) {
            for (const act of activities) {
                if (!act.serviceId || !act.activityTime) continue;
                await prisma.overrideLog.create({
                    data: {
                        bookingId: booking.id,
                        clerkUserId: userId,
                        userName: userName || "Unknown",
                        reason: overrideReason,
                        serviceId: act.serviceId,
                        serviceName: act.activityType,
                        slotTime: act.activityTime,
                        date: new Date(act.activityDate).toISOString().split("T")[0],
                    },
                });
            }
        }

        // GCAL SYNC FOR EACH ACTIVITY
        // Track calendars already assigned in this booking to avoid double-booking
        // the same physical resource (e.g. two jetski activities → two different jetski calendars)
        const usedCalendarIds = new Set<string>();
        for (const act of booking.activities) {
            if (act.serviceId && act.activityTime && act.activityDate) {
                try {
                    const svc = await prisma.service.findUnique({ where: { id: act.serviceId } });
                    if (svc?.gcalEnabled && svc.durationMinutes) {
                        const staffList = await prisma.gcalStaff.findMany({
                            where: { serviceId: act.serviceId },
                            orderBy: { order: "asc" },
                        });
                        const requestedQty = act.quantity || act.pax || 1;
                        // Skip calendars already booked by an earlier activity in this booking
                        const available = staffList.filter(s => !usedCalendarIds.has(s.calendarId));
                        const toBook = available.slice(0, requestedQty);
                        if (toBook.length > 0) {
                            const dateStr = new Date(act.activityDate).toISOString().split("T")[0];
                            const { startISO, endISO } = toGcalTimes(dateStr, act.activityTime, svc.durationMinutes);
                            const summary = `CRM Booking - ${customerName} (${act.activityType})`;
                            const eventIds: string[] = [];
                            const calendarIds: string[] = [];
                            for (const staff of toBook) {
                                const eventId = await createBusyEvent(staff.calendarId, startISO, endISO, summary);
                                if (eventId) {
                                    eventIds.push(eventId);
                                    calendarIds.push(staff.calendarId);
                                    usedCalendarIds.add(staff.calendarId);
                                }
                            }
                            if (eventIds.length > 0) {
                                await prisma.bookingActivity.update({
                                    where: { id: act.id },
                                    data: {
                                        gcalEventIds: JSON.stringify(eventIds),
                                        gcalCalendarIds: JSON.stringify(calendarIds),
                                    },
                                });
                            }
                        }
                    }
                } catch (gcalErr) {
                    console.error("GCal sync error (act):", gcalErr);
                }
            }
        }

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Failed to create booking:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
