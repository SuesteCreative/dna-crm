import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { syncGcalToCache } from "@/lib/gcal-cache";
import { renewAllWatches } from "@/lib/gcal";

export const dynamic = "force-dynamic";

export async function POST() {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const prisma = await getPrisma();
        const staff = await prisma.gcalStaff.findMany({
            select: { calendarId: true }
        });

        const syncResults = [];
        for (const s of staff) {
            const res = await syncGcalToCache(s.calendarId);
            syncResults.push({ calendarId: s.calendarId, ...res });
        }

        // Also renew/setup the push notification watches
        let watchResults: any[] = [];
        try {
            watchResults = await renewAllWatches();
        } catch (we) {
            console.error("Watch renewal failed:", we);
        }

        return NextResponse.json({ success: true, syncResults, watchResults });
    } catch (error) {
        console.error("GCal sync error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
