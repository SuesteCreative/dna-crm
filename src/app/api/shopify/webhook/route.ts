import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";

async function verifyHmac(body: string, secret: string, hmacHeader: string): Promise<boolean> {
    try {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw", enc.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false, ["sign"]
        );
        const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
        const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
        return computed === hmacHeader;
    } catch {
        return false;
    }
}

function parseOrderToBooking(order: any) {
    const firstLineItem = order.line_items?.[0];
    const properties: { name: string; value: string }[] = firstLineItem?.properties || [];

    let activityDate = new Date(order.created_at);
    let activityTime: string | null = null;
    let pax = 1;

    for (const prop of properties) {
        const name = prop.name.toLowerCase();
        const value = prop.value;
        if (name.includes("date")) { try { activityDate = new Date(value); } catch { } }
        if (name.includes("time")) { activityTime = value; }
        if (name.includes("people") || name.includes("pax") || name.includes("quant")) {
            pax = parseInt(value) || 1;
        }
    }

    const status = order.cancelled_at
        ? "CANCELLED"
        : order.financial_status === "paid" ? "CONFIRMED" : "PENDING";

    return {
        shopifyId: order.id.toString(),
        customerName: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || "Consumidor Final",
        customerEmail: order.customer?.email || null,
        customerPhone: order.customer?.phone || null,
        activityDate,
        activityTime,
        pax,
        status,
        source: "SHOPIFY",
        totalPrice: parseFloat(order.total_price || "0"),
        createdById: "shopify-webhook",
    };
}

export async function POST(req: NextRequest) {
    // Read raw body FIRST (needed for signature check)
    const rawBody = await req.text();
    const topic = req.headers.get("x-shopify-topic");
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256") || "";

    // Fetch webhook secret from Cloudflare env
    let webhookSecret: string | undefined;
    try {
        const { env } = await getCloudflareContext();
        webhookSecret = (env as any).SHOPIFY_WEBHOOK_SECRET;
    } catch {
        webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;
    }

    // Verify signature if secret is configured
    if (webhookSecret && hmacHeader) {
        const valid = await verifyHmac(rawBody, webhookSecret, hmacHeader);
        if (!valid) {
            console.error("Shopify webhook HMAC verification failed");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    try {
        const order = JSON.parse(rawBody);
        const prisma = await getPrisma();

        if (topic === "orders/create" || topic === "orders/updated" || topic === "orders/paid") {
            const booking = parseOrderToBooking(order);
            await (prisma as any).booking.upsert({
                where: { shopifyId: booking.shopifyId },
                update: { status: booking.status, totalPrice: booking.totalPrice },
                create: booking,
            });
            console.log(`Webhook ${topic}: upserted booking for order ${order.id}`);
        } else if (topic === "orders/cancelled") {
            await (prisma as any).booking.updateMany({
                where: { shopifyId: order.id.toString() },
                data: { status: "CANCELLED" },
            });
            console.log(`Webhook orders/cancelled: updated order ${order.id}`);
        } else {
            console.log(`Webhook topic not handled: ${topic}`);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Shopify webhook processing error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
