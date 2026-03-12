import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { fixMojibake } from "@/lib/encoding";

export const dynamic = "force-dynamic";

export async function POST() {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const prisma = await getPrisma();

    // Fetch all bookings with potentially mojibake names
    const bookings = await prisma.booking.findMany({
        select: { id: true, customerName: true },
    });

    let fixed = 0;
    for (const b of bookings) {
        if (!b.customerName) continue;
        const corrected = fixMojibake(b.customerName);
        if (corrected !== b.customerName) {
            await prisma.booking.update({
                where: { id: b.id },
                data: { customerName: corrected },
            });
            fixed++;
        }
    }

    return NextResponse.json({ fixed, total: bookings.length });
}
