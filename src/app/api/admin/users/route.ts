import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const clerk = await clerkClient();
        const response = await clerk.users.getUserList({ limit: 100 });

        const users = response.data.map((u) => ({
            id: u.id,
            name: [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                  (u.unsafeMetadata?.requestName as string) || "—",
            email: u.emailAddresses[0]?.emailAddress || "—",
            imageUrl: u.imageUrl,
            role: (u.publicMetadata?.role as string) || "USER",
            partnerId: (u.publicMetadata?.partnerId as string) || null,
            createdAt: u.createdAt,
            profileInfo: u.unsafeMetadata && Object.keys(u.unsafeMetadata).length > 0 ? {
                requestName: (u.unsafeMetadata.requestName as string) || null,
                companyName: (u.unsafeMetadata.companyName as string) || null,
                nif: (u.unsafeMetadata.nif as string) || null,
                phone: (u.unsafeMetadata.phone as string) || null,
                website: (u.unsafeMetadata.website as string) || null,
            } : null,
        }));

        return NextResponse.json(users);
    } catch (error) {
        console.error("Failed to list users:", error);
        return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
    }
}
