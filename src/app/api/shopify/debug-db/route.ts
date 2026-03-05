export const runtime = "edge";
import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
    try {
        const prisma = await getPrisma();
        const count = await (prisma as any).booking.count();
        return NextResponse.json({ success: true, count });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || String(e) });
    }
}
