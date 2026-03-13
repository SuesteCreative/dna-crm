import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { deleteBusyEvent } from "@/lib/gcal";
import { logAudit } from "@/lib/audit";
import { timeToMinutes, timesOverlap } from "@/lib/slots";
import { ensureCustomer } from "@/lib/customers";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const prisma = await getPrisma();
        const data = await req.json();
        const { id, override, overrideReason, userName, activities: reqActivities, forPartnerId, discountAmount, discountType, ...fields } = data;

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const current = await prisma.booking.findUnique({
            where: { id },
            include: { activities: true }
        });
        if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const { sessionClaims } = await auth();
        const role = (sessionClaims as any)?.metadata?.role as string | undefined;
        const sessionPartnerId = (sessionClaims as any)?.metadata?.partnerId as string | undefined;
        const isPartner = role === "PARTNER";

        // Partners can only edit their own bookings
        if (isPartner && current.partnerId !== sessionPartnerId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Validate status if provided
        const VALID_STATUSES = ["CONFIRMED", "CANCELLED", "NO_SHOW"];
        if (fields.status && !VALID_STATUSES.includes(fields.status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Validate discount
        const rawDiscount = parseFloat(discountAmount);
        if (discountAmount !== undefined && (isNaN(rawDiscount) || rawDiscount < 0)) {
            return NextResponse.json({ error: "Invalid discountAmount" }, { status: 400 });
        }
        if (discountType === "%" && rawDiscount > 100) {
            return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
        }

        // 1. Prepare activities for check
        // If not provided, fallback to top-level fields (legacy/simple edit)
        let activitiesToProcess = reqActivities;
        if (!activitiesToProcess || !Array.isArray(activitiesToProcess)) {
            activitiesToProcess = [{
                id: current.activities[0]?.id, // use existing first activity if possible
                serviceId: fields.serviceId || current.serviceId,
                activityDate: fields.activityDate || current.activityDate,
                activityTime: fields.activityTime || current.activityTime,
                pax: fields.pax !== undefined ? parseInt(fields.pax) : (current.pax || 1),
                quantity: fields.quantity !== undefined ? parseInt(fields.quantity) : (current.quantity || 1),
                totalPrice: fields.totalPrice !== undefined ? parseFloat(fields.totalPrice) : current.totalPrice,
                activityType: fields.activityType || current.activityType
            }];
        }

        const effStatus = fields.status || current.status;

        // 2. Capacity Checks
        if (effStatus !== "CANCELLED") {
            const allServices = await prisma.service.findMany();
            
            for (const act of activitiesToProcess) {
                const svcId = act.serviceId;
                if (!svcId || !act.activityTime || !act.activityDate) continue;

                const service = allServices.find(s => s.id === svcId);
                if (!service?.durationMinutes) continue;

                let serviceIds: string[] = [svcId];
                if (service.capacityGroup) {
                    serviceIds = allServices.filter(s => s.capacityGroup === service.capacityGroup).map(s => s.id);
                }

                const dateStr = new Date(act.activityDate).toISOString().split("T")[0];
                const startOfDay = new Date(dateStr + "T00:00:00.000Z");
                const endOfDay = new Date(dateStr + "T23:59:59.999Z");

                const otherBookingsActities = await prisma.bookingActivity.findMany({
                    where: {
                        id: { not: act.id || "none" }, // EXCLUDE THIS SPECIFIC ACTIVITY
                        booking: { status: { not: "CANCELLED" }, deletedAt: null },
                        serviceId: { in: serviceIds },
                        activityDate: { gte: startOfDay, lte: endOfDay },
                    },
                    select: { activityTime: true, quantity: true, serviceId: true },
                });

                const slotStart = timeToMinutes(act.activityTime);
                let usedCapacity = 0;
                for (const other of otherBookingsActities) {
                    if (!other.activityTime) continue;
                    const otherStart = timeToMinutes(other.activityTime);
                    const otherSvc = allServices.find(s => s.id === other.serviceId);
                    const otherDur = otherSvc?.durationMinutes ?? service.durationMinutes;

                    if (timesOverlap(slotStart, service.durationMinutes, otherStart, otherDur)) {
                        usedCapacity += other.quantity ?? 1;
                    }
                }

                const requestedQty = parseInt(act.quantity) || parseInt(act.pax) || 1;
                const totalCap = service.unitCapacity ?? 1;
                const available = totalCap - usedCapacity;

                if (available < requestedQty) {
                    if (isPartner) return NextResponse.json({ error: "SLOT_FULL", available, capacity: totalCap, activity: act.activityType }, { status: 409 });
                    if (!override) return NextResponse.json({ error: "SLOT_FULL", available, capacity: totalCap, canOverride: true, activity: act.activityType }, { status: 409 });
                }

                // If override applied, log it
                if (override && overrideReason && !isPartner) {
                    await prisma.overrideLog.create({
                        data: {
                            bookingId: id,
                            clerkUserId: userId,
                            userName: userName || "Unknown",
                            reason: overrideReason,
                            serviceId: svcId,
                            serviceName: act.activityType || service.name,
                            slotTime: act.activityTime,
                            date: dateStr,
                        },
                    });
                }
            }
        }

        // 3. Handle Deletions (GCal and DB)
        const keptActivityIds = activitiesToProcess.map((a: any) => a.id).filter(Boolean);
        const activitiesToDelete = current.activities.filter(a => !keptActivityIds.includes(a.id));

        for (const act of activitiesToDelete) {
            if (act.gcalEventIds && act.gcalCalendarIds) {
                try {
                    const eIds: string[] = JSON.parse(act.gcalEventIds);
                    const cIds: string[] = JSON.parse(act.gcalCalendarIds);
                    for (let i = 0; i < eIds.length; i++) {
                        await deleteBusyEvent(cIds[i], eIds[i]);
                    }
                } catch (gcalErr) {
                    console.error("gcal delete for removed activity failed:", gcalErr);
                }
            }
        }

        // If whole booking is cancelled, delete GCal events for REMAINING activities too
        if (effStatus === "CANCELLED") {
            for (const act of current.activities) {
                if (act.gcalEventIds && act.gcalCalendarIds) {
                    try {
                        const eIds: string[] = JSON.parse(act.gcalEventIds);
                        const cIds: string[] = JSON.parse(act.gcalCalendarIds);
                        for (let i = 0; i < eIds.length; i++) {
                            await deleteBusyEvent(cIds[i], eIds[i]);
                        }
                    } catch (gcalErr) {
                        console.error("gcal cancel-delete failed:", gcalErr);
                    }
                }
            }
        }

        // 4. Data Updates
        const captureOriginals = !current.isEdited;
        const customerId = await ensureCustomer({
            name: fields.customerName || current.customerName,
            email: fields.customerEmail || current.customerEmail,
            phone: fields.customerPhone || current.customerPhone,
            country: fields.countryCode || current.country
        });

        // Determine primary date/time/service for the top-level row (usually from first activity)
        const primaryAct = activitiesToProcess[0];
        const rawSum = activitiesToProcess.reduce((sum: number, a: any) => sum + (parseFloat(a.totalPrice) || 0), 0);
        const discAmt = parseFloat(discountAmount || (current as any).discountAmount || 0);
        const discType = discountType || (current as any).discountType || "%";
        let calculatedTotal = rawSum;
        if (discAmt > 0) {
            calculatedTotal = (discType === "%") ? rawSum * (1 - discAmt / 100) : rawSum - discAmt;
        }

        const updatedBooking = await prisma.$transaction(async (tx) => {
            // Delete removed activities
            if (activitiesToDelete.length > 0) {
                await tx.bookingActivity.deleteMany({
                    where: { id: { in: activitiesToDelete.map(a => a.id) } }
                });
            }

            // Update parent
            const booking = await tx.booking.update({
                where: { id },
                data: {
                    customerName: fields.customerName,
                    customerEmail: fields.customerEmail || null,
                    customerPhone: fields.customerPhone || null,
                    activityDate: primaryAct ? new Date(primaryAct.activityDate) : undefined,
                    activityTime: primaryAct?.activityTime || null,
                    pax: primaryAct?.pax ? parseInt(primaryAct.pax) : undefined,
                    quantity: primaryAct?.quantity ? parseInt(primaryAct.quantity) : undefined,
                    totalPrice: fields.totalPrice !== undefined ? (parseFloat(fields.totalPrice) > 0 ? parseFloat(fields.totalPrice) : calculatedTotal) : undefined,
                    activityType: primaryAct?.activityType || null,
                    status: fields.status || undefined,
                    notes: fields.notes || null,
                    country: fields.countryCode === undefined ? undefined : (fields.countryCode || "Other"),
                    bookingFee: fields.bookingFee !== undefined ? parseFloat(fields.bookingFee) || 0 : undefined,
                    partnerId: forPartnerId === undefined ? undefined : (forPartnerId || null),
                    source: forPartnerId === undefined ? undefined : (forPartnerId ? "PARTNER" : "MANUAL"),
                    discountAmount: discountAmount !== undefined ? parseFloat(discountAmount) || 0 : undefined,
                    discountType: discountType || undefined,
                    isEdited: true,
                    customerId,
                    ...(captureOriginals && {
                        originalActivityType: current.activityType,
                        originalPax: current.pax,
                        originalQuantity: current.quantity,
                        originalTotalPrice: current.totalPrice,
                        originalActivityDate: current.activityDate,
                        originalActivityTime: current.activityTime,
                    }),
                } as any,
                include: { activities: true }
            });

            // Upsert activities
            for (const act of activitiesToProcess) {
                const actData = {
                    serviceId: act.serviceId || null,
                    activityType: act.activityType || null,
                    activityDate: new Date(act.activityDate),
                    activityTime: act.activityTime || null,
                    pax: parseInt(act.pax) || 1,
                    quantity: parseInt(act.quantity) || 1,
                    totalPrice: parseFloat(act.totalPrice) || 0,
                };

                if (act.id) {
                    await tx.bookingActivity.update({
                        where: { id: act.id },
                        data: actData
                    });
                } else {
                    await tx.bookingActivity.create({
                        data: {
                            ...actData,
                            bookingId: id
                        }
                    });
                }
            }

            return booking;
        });

        // 5. GCal Sync for remaining activities
        // (For simplicity in this update, we could re-sync all current activities if date/time changed)
        // This would require importing createGcalEvents or similar. 
        // For now, at least the basic metadata is updated.

        await logAudit({
            userId,
            action: fields.status === "CANCELLED" ? "CANCEL" : "UPDATE",
            module: "DASHBOARD",
            targetId: current.id,
            targetName: current.customerName,
            details: {
                changes: fields,
                activities: activitiesToProcess.length,
                previous: {
                    customerName: current.customerName,
                    status: current.status,
                }
            },
        });

        return NextResponse.json(updatedBooking);
    } catch (err: any) {
        console.error("Failed to update booking:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
