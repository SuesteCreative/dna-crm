import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { syncGcalToCache } from "@/lib/gcal-cache";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const channelId = req.headers.get("x-goog-channel-id");
    const resourceId = req.headers.get("x-goog-resource-id");
    const resourceState = req.headers.get("x-goog-resource-state"); // "sync", "exists", etc.

    // Google sends a 'sync' notification when a watch is first established
    if (resourceState === "sync") {
        console.log(`GCal Webhook: Channel ${channelId} confirmed sync.`);
        return new NextResponse("Sync confirmed", { status: 200 });
    }

    if (!channelId || !resourceId) {
        return new NextResponse("Missing headers", { status: 400 });
    }

    try {
        const prisma = await getPrisma();
        const staff = await (prisma as any).gcalStaff.findUnique({
            where: { channelId }
        });

        if (!staff) {
            // Channel might be old or from a previous session
            console.warn(`GCal Webhook: No active staff record found for channel ${channelId}`);
            return new NextResponse("Unknown channel", { status: 200 }); // Return 200 to stop further retries from Google
        }

        // Trigger cache sync for the relevant calendar
        console.log(`GCal Webhook: Update detected for ${staff.name}. Syncing ${staff.calendarId}...`);
        const result = await syncGcalToCache(staff.calendarId);

        if (result.success) {
            console.log(`GCal Webhook: ${staff.name} sync completed. ${result.count} events updated.`);
        } else {
            console.error(`GCal Webhook: ${staff.name} sync failed:`, result.error);
        }

        return new NextResponse("OK", { status: 200 });
    } catch (err) {
        console.error("GCal Webhook process error:", err);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
