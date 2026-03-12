import { NextResponse } from "next/server";
import { getUserPermissions } from "@/lib/permissions";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;

    try {
        const p = await getUserPermissions(role);
        return NextResponse.json(p);
    } catch (e) {
        return NextResponse.json({ error: "Failed to load permissions" }, { status: 500 });
    }
}
