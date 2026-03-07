import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const prisma = await getPrisma();
    const logs = await prisma.overrideLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
    });

    return NextResponse.json(logs);
}
