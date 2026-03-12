import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { syncGcalToCache } from "@/lib/gcal-cache";

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

        const results = [];
        for (const s of staff) {
            const res = await syncGcalToCache(s.calendarId);
            results.push({ calendarId: s.calendarId, ...res });
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error("GCal sync error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
