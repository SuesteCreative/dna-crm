import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { timeToMinutes, timesOverlap } from "@/lib/slots";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isPartner = role === "PARTNER";

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
        } = data;

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
                source: isPartner ? "PARTNER" : "MANUAL",
                status: "CONFIRMED",
                serviceId: serviceId || null,
                activityType: activityType || null,
            },
        });

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

        return NextResponse.json(booking);
    } catch (error) {
        console.error("Failed to create booking:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
