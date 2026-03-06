import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const prisma = await getPrisma();
        const data = await req.json();

        if (!data.name || !data.email) {
            return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
        }

        const partner = await prisma.partner.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                address: data.address || null,
                website: data.website || null,
                commission: parseFloat(data.commission) || 10,
            },
        });

        // Send Clerk invitation email to the partner
        try {
            const clerk = await clerkClient();
            await clerk.invitations.createInvitation({
                emailAddress: partner.email,
                redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/sign-in`,
                publicMetadata: {
                    role: "PARTNER",
                    partnerId: partner.id,
                },
                notify: true,
            });
        } catch (inviteError: any) {
            // If invitation fails (e.g. user already exists in Clerk), don't block the response
            console.warn("Clerk invitation warning:", inviteError?.message || inviteError);
        }

        return NextResponse.json(partner);
    } catch (error: any) {
        if (error?.code === "P2002") {
            return NextResponse.json({ error: "Já existe um parceiro com este email" }, { status: 409 });
        }
        console.error("Failed to create partner:", error);
        return NextResponse.json({ error: "Failed to create partner" }, { status: 500 });
    }
}
