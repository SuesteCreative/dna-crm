import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
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
