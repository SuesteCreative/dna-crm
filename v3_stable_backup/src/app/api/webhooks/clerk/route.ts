import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { getPrisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        console.error("CLERK_WEBHOOK_SECRET not set");
        return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    // Verify the webhook signature
    const svix_id = req.headers.get("svix-id");
    const svix_timestamp = req.headers.get("svix-timestamp");
    const svix_signature = req.headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
    }

    const body = await req.text();
    const wh = new Webhook(WEBHOOK_SECRET);

    let event: any;
    try {
        event = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    // Handle user.created — link partner if metadata is present
    if (event.type === "user.created") {
        const { id: clerkUserId, email_addresses, public_metadata } = event.data;
        const email = email_addresses?.[0]?.email_address;
        const partnerId = public_metadata?.partnerId as string | undefined;
        const role = (public_metadata?.role as string | undefined) || "USER";

        if (!email) {
            return NextResponse.json({ received: true });
        }

        try {
            const prisma = await getPrisma();

            // Upsert the user in our DB, linking to partner if applicable
            await prisma.user.upsert({
                where: { email },
                update: {
                    role,
                    ...(partnerId ? { partnerId } : {}),
                },
                create: {
                    email,
                    role,
                    ...(partnerId ? { partnerId } : {}),
                },
            });

            // Set role in Clerk publicMetadata so middleware can read it without DB calls
            if (role === "PARTNER" && partnerId) {
                const clerk = await clerkClient();
                await clerk.users.updateUserMetadata(clerkUserId, {
                    publicMetadata: { role: "PARTNER", partnerId },
                });
            }
        } catch (err) {
            console.error("Webhook user.created handler error:", err);
            return NextResponse.json({ error: "Failed to process user" }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}
