import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { deleteBusyEvent } from "@/lib/gcal";
import { logAudit } from "@/lib/audit";

export async function DELETE(req: Request) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const sessionPartnerId = (sessionClaims as any)?.metadata?.partnerId as string | undefined;
    const isPartner = role === "PARTNER";

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const prisma = await getPrisma();
        const booking = await prisma.booking.findUnique({
            where: { id },
            include: { partner: true, activities: true }
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Partners can only delete their own bookings
        if (isPartner && booking.partnerId !== sessionPartnerId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Delete Google Calendar events for the parent booking (legacy single-activity)
        if (booking.gcalEventIds && booking.gcalCalendarIds) {
            try {
                const eventIds: string[] = JSON.parse(booking.gcalEventIds);
                const calendarIds: string[] = JSON.parse(booking.gcalCalendarIds);
                for (let i = 0; i < eventIds.length; i++) {
                    await deleteBusyEvent(calendarIds[i], eventIds[i]);
                }
            } catch (gcalErr) {
                console.error("gcal delete failed (non-blocking):", gcalErr);
            }
        }

        // Delete Google Calendar events for each BookingActivity (multi-activity bookings)
        for (const act of (booking as any).activities ?? []) {
            if (act.gcalEventIds && act.gcalCalendarIds) {
                try {
                    const eIds: string[] = JSON.parse(act.gcalEventIds);
                    const cIds: string[] = JSON.parse(act.gcalCalendarIds);
                    for (let i = 0; i < eIds.length; i++) {
                        await deleteBusyEvent(cIds[i], eIds[i]);
                    }
                } catch (gcalErr) {
                    console.error("gcal activity delete failed (non-blocking):", gcalErr);
                }
            }
        }

        await prisma.booking.update({ where: { id }, data: { deletedAt: new Date() } });

        await logAudit({
            userId,
            action: "SOFT_DELETE",
            module: "DASHBOARD",
            targetId: id,
            targetName: booking.customerName || undefined,
            details: {
                message: "Reserva marcada como eliminada (soft-delete).",
                ...booking,
                partnerName: (booking as any).partner?.name || "N/A"
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete booking error:", error);
        return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }
}
