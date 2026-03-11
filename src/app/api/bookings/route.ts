import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;

    try {
        const prisma = await getPrisma();

        let where: Record<string, any> = {};
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        const metadata = clerkUser.publicMetadata as any;
        const pId = metadata.partnerId as string | undefined;

        // Force partner filter if they have a partnerId or the explicit role
        if (role === "PARTNER" || pId) {
            where = { partnerId: pId ?? "__none__" };
        }

        const bookings = await prisma.booking.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Failed to fetch bookings:", error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}
