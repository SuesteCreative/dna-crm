import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_ROLES = ["USER", "PARTNER", "ADMIN", "SUPER_ADMIN"];

export async function POST(req: Request) {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callerRole = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (callerRole !== "SUPER_ADMIN" && callerRole !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { targetUserId, role, partnerId } = await req.json();

        if (!targetUserId || !role) {
            return NextResponse.json({ error: "targetUserId and role are required" }, { status: 400 });
        }

        if (!VALID_ROLES.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Only SUPER_ADMIN can assign SUPER_ADMIN or ADMIN roles
        if ((role === "SUPER_ADMIN" || role === "ADMIN") && callerRole !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Only SUPER_ADMIN can assign this role" }, { status: 403 });
        }

        const clerk = await clerkClient();

        const metadata: Record<string, any> = { role };
        if (partnerId) metadata.partnerId = partnerId;

        await clerk.users.updateUserMetadata(targetUserId, {
            publicMetadata: metadata,
        });

        // Sync to DB if we have an email
        try {
            const clerkUser = await clerk.users.getUser(targetUserId);
            const email = clerkUser.emailAddresses[0]?.emailAddress;
            if (email) {
                const prisma = await getPrisma();
                await prisma.user.upsert({
                    where: { email },
                    update: { role, ...(partnerId ? { partnerId } : {}) },
                    create: { email, role, ...(partnerId ? { partnerId } : {}) },
                });
            }
        } catch (dbErr) {
            console.warn("DB sync warning:", dbErr);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Assign role error:", error);
        return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
    }
}
