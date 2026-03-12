import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(req: Request) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Only admins can update partners" }, { status: 403 });
    }

    try {
        const prisma = await getPrisma();
        const data = await req.json();
        const { id, name, email, phone, address, website, commission } = data;

        if (!id) return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });

        const partner = await prisma.partner.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address,
                website,
                commission: parseFloat(commission as any) || 0
            }
        });

        return NextResponse.json(partner);
    } catch (error: any) {
        console.error("Failed to update partner:", error);
        return NextResponse.json({ error: error.message || "Failed to update partner" }, { status: 500 });
    }
}
