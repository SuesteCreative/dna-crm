import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { deleteBusyEvent } from "@/lib/gcal";
import { logAudit } from "@/lib/audit";

export async function DELETE(req: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const prisma = await getPrisma();

        // Delete Google Calendar events before removing the booking
        const booking = await prisma.booking.findUnique({
            where: { id },
            select: { customerName: true, gcalEventIds: true, gcalCalendarIds: true },
        });
        if (booking?.gcalEventIds && booking?.gcalCalendarIds) {
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

        await prisma.booking.delete({ where: { id } });

        await logAudit({
            userId,
            action: "DELETE",
            module: "DASHBOARD",
            targetId: id,
            targetName: booking?.customerName || id,
            details: {
                message: "Booking deleted via API (possibly partner deletion)",
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete booking error:", error);
        return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }
}
