import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: Request) {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;

    if (!userId || role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
        }

        const prisma = await getPrisma();
        await prisma.auditLog.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete audit logs:", error);
        return NextResponse.json({ error: "Failed to delete audit logs" }, { status: 500 });
    }
}
