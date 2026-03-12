import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
