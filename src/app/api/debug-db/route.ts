import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
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
