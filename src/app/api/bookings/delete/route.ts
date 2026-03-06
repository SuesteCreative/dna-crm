import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const prisma = await getPrisma();
        await prisma.booking.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete booking error:", error);
        return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
    }
}
