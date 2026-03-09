import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const moduleFilter = searchParams.get("module");
    const actionFilter = searchParams.get("action");
    const userSearch = searchParams.get("user");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const prisma = await getPrisma();
    const where: any = {};
    if (moduleFilter) where.module = { startsWith: moduleFilter };
    if (actionFilter) where.action = actionFilter;
    if (userSearch) where.userName = { contains: userSearch, mode: "insensitive" };

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate + "T00:00:00.000Z");
        if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59.999Z");
    }

    const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 500,
    });

    return NextResponse.json(logs);
}
