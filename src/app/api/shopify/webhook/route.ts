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
        const computed = Buffer.from(sig).toString("base64");
        return computed === hmacHeader;
    } catch {
        return false;
    }
}

function parseOrderToBooking(order: any) {
    const firstLineItem = order.line_items?.[0];
    const properties: { name: string; value: string }[] = firstLineItem?.properties || [];

    // Index all properties by name for quick lookup
    const props: Record<string, string> = {};
    for (const p of properties) props[p.name] = p.value;

    // ── Meety date/time ──────────────────────────────────────────────
    // _meety_from_time: "2025-10-09T14:10:00.000+01:00"
    let activityDate: Date;
    let activityTime: string | null = null;

    if (props["_meety_from_time"]) {
        const from = new Date(props["_meety_from_time"]);
        activityDate = from;
        const tz = props["_meety_timezone"] || "Europe/Lisbon";
        activityTime = from.toLocaleTimeString("pt-PT", {
            hour: "2-digit", minute: "2-digit", timeZone: tz
        });
    } else {
        // Generic fallback for other booking apps
        activityDate = new Date(order.created_at);
        for (const p of properties) {
            const n = p.name.toLowerCase();
            if (n.includes("date") && !n.startsWith("_meety")) { try { activityDate = new Date(p.value); } catch { } }
            if (n.includes("time") && !n.startsWith("_meety")) { activityTime = p.value; }
        }
    }

    // ── Meety pax ────────────────────────────────────────────────────
    // _meety_user_inputs_XXXXX: "How many people will be attending => 2"
    let pax = parseInt(props["_meety_numslots"] || "1") || 1;
    for (const [key, value] of Object.entries(props)) {
        if (key.startsWith("_meety_user_inputs")) {
            const match = value.match(/=>\s*(\d+)/);
            if (match) { pax = parseInt(match[1]) || pax; break; }
        }
    }

    // ── Status & activity name ────────────────────────────────────────
    const status = order.cancelled_at
        ? "CANCELLED"
        : order.financial_status === "paid" ? "CONFIRMED" : "PENDING";

    const activityName = firstLineItem?.title || null;

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
        notes: activityName,
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
