import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role === "PARTNER") return NextResponse.json({ error: "Partners cannot mark attendance" }, { status: 403 });

    try {
        const { id, showedUp } = await req.json();
        if (!id || typeof showedUp !== "boolean") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const prisma = await getPrisma();
        const booking = await prisma.booking.update({
            where: { id },
            data: { showedUp },
        });

        return NextResponse.json({ success: true, showedUp: booking.showedUp });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
