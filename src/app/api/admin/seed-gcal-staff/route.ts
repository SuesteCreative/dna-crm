import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
    const { sessionClaims } = await auth();
    if ((sessionClaims as any)?.metadata?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const raw = process.env.GCAL_STAFF_CONFIG;
    if (!raw) {
        return NextResponse.json({ error: "GCAL_STAFF_CONFIG env var not set" }, { status: 500 });
    }

    let entries: { name: string; calendarId: string; capacityGroup?: string; order: number }[];
    try {
        entries = JSON.parse(raw);
    } catch {
        return NextResponse.json({ error: "GCAL_STAFF_CONFIG is not valid JSON" }, { status: 500 });
    }

    const prisma = await getPrisma();

    // Wipe existing rows and recreate from config
    await (prisma as any).gcalStaff.deleteMany({});
    await (prisma as any).gcalStaff.createMany({
        data: entries.map(e => ({ name: e.name, calendarId: e.calendarId, capacityGroup: e.capacityGroup || null, order: e.order })),
    });

    return NextResponse.json({ ok: true, seeded: entries.map(e => e.name) });
}
