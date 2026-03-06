import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const prisma = await getPrisma();
        const partners = await prisma.partner.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(partners);
    } catch (error) {
        console.error("Failed to fetch partners:", error);
        return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
    }
}
