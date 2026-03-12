import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { sendFollowUpEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    // Basic protection using a secret header or just rely on Vercel Cron protection
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const prisma = await getPrisma();

        // Calculate "yesterday" range
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.toISOString().split("T")[0] + "T00:00:00.000Z");
        const endOfYesterday = new Date(yesterday.toISOString().split("T")[0] + "T23:59:59.999Z");

        // Find bookings that showed up yesterday and don't have follow-up sent
        const bookings = await prisma.booking.findMany({
            where: {
                activityDate: {
                    gte: startOfYesterday,
                    lte: endOfYesterday,
                },
                showedUp: true,
                followUpSent: false,
                status: "CONFIRMED",
                customerEmail: { not: null },
            },
        });

        const results = [];
        for (const booking of bookings) {
            try {
                await sendFollowUpEmail(booking);
                results.push({ id: booking.id, status: "sent" });
            } catch (err) {
                console.error(`Failed to send follow-up for ${booking.id}:`, err);
                results.push({ id: booking.id, status: "failed", error: String(err) });
            }
        }

        return NextResponse.json({
            success: true,
            processed: bookings.length,
            details: results,
        });
    } catch (error) {
        console.error("Cron follow-up error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
