import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { targetUserId, newPassword } = await req.json();

    if (!targetUserId || !newPassword) {
        return NextResponse.json({ error: "targetUserId and newPassword required" }, { status: 400 });
    }

    if (newPassword.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Prevent changing own password via this endpoint
    if (targetUserId === userId) {
        return NextResponse.json({ error: "Use the profile page to change your own password" }, { status: 400 });
    }

    try {
        const clerk = await clerkClient();
        await clerk.users.updateUser(targetUserId, { password: newPassword });
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Reset password failed:", err);
        return NextResponse.json({ error: err?.errors?.[0]?.message || "Failed to reset password" }, { status: 500 });
    }
}
