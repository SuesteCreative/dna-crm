import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { deleteBusyEvent } from "@/lib/gcal";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const prisma = await getPrisma();
        const data = await req.json();
        const { id, ...fields } = data;

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        // Fetch current booking to capture originals on first edit
        const current = await prisma.booking.findUnique({ where: { id } });
        if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
            },
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
