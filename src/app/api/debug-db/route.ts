import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const prisma = await getPrisma();
        const count = await prisma.booking.count();
        const first = await prisma.booking.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            status: "success",
            database: "connected",
            count,
            latest: first
        });
    } catch (error: any) {
        console.error("Debug route error:", error);
        return NextResponse.json({
            status: "error",
            message: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
