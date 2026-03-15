import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// One-time endpoint: sets showedUp=true on all past CONFIRMED bookings
// where showedUp has never been explicitly set (IS NULL).
// Does NOT touch bookings where showedUp was already set to false (intentional no-shows).
export async function POST() {
    const { sessionClaims } = await auth();
    if ((sessionClaims as any)?.metadata?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prisma = await getPrisma();

    const todayLisbon = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Lisbon" }).format(new Date());
    const todayStart = new Date(todayLisbon + "T00:00:00.000Z");

    const result = await prisma.booking.updateMany({
        where: {
            activityDate: { lt: todayStart },
            status: "CONFIRMED",
            showedUp: null,
            deletedAt: null,
        },
        data: { showedUp: true },
    });

    return NextResponse.json({ updated: result.count });
}
