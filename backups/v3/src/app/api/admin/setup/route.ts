import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// One-time bootstrap route — sets the current user as SUPER_ADMIN
// Only works if no SUPER_ADMIN exists yet
export async function POST() {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const clerk = await clerkClient();

        // Check if any SUPER_ADMIN already exists
        const allUsers = await clerk.users.getUserList({ limit: 100 });
        const existingSuperAdmin = allUsers.data.find(
            (u) => u.publicMetadata?.role === "SUPER_ADMIN"
        );

        if (existingSuperAdmin) {
            return NextResponse.json(
                { error: "A SUPER_ADMIN already exists. Setup can only run once." },
                { status: 409 }
            );
        }

        await clerk.users.updateUserMetadata(userId, {
            publicMetadata: { role: "SUPER_ADMIN" },
        });

        return NextResponse.json({ success: true, message: "You are now SUPER_ADMIN. Please sign out and sign back in." });
    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json({ error: "Setup failed" }, { status: 500 });
    }
}
