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
    const properties = firstLineItem?.properties || [];

    // Index all properties by name for quick lookup
    const props: Record<string, string> = {};
    if (Array.isArray(properties)) {
        for (const p of properties) {
            if (p && typeof p.name === "string" && typeof p.value === "string") {
                props[p.name] = p.value;
            }
        }
    }

    // ── Meety date/time ──────────────────────────────────────────────
    let activityDate: Date;
    let activityTime: string | null = null;

    if (props["_meety_from_time"]) {
        const from = new Date(props["_meety_from_time"]);
        activityDate = isNaN(from.getTime()) ? new Date(order.created_at) : from;
        const tz = props["_meety_timezone"] || "Europe/Lisbon";
        if (!isNaN(from.getTime())) {
            activityTime = from.toLocaleTimeString("pt-PT", {
                hour: "2-digit", minute: "2-digit", timeZone: tz
            });
        }
    } else {
        activityDate = new Date(order.created_at);
        if (isNaN(activityDate.getTime())) activityDate = new Date();
        for (const [name, value] of Object.entries(props)) {
            const n = name.toLowerCase();
            if (n.includes("date") && !n.startsWith("_meety")) {
                const d = new Date(value);
                if (!isNaN(d.getTime())) activityDate = d;
            }
            if (n.includes("time") && !n.startsWith("_meety")) {
                activityTime = value;
            }
        }
    }

    // ── Meety pax ────────────────────────────────────────────────────
    let pax = parseInt(props["_meety_numslots"] || "1", 10);
    if (isNaN(pax) || pax < 1) pax = 1;
    for (const [key, value] of Object.entries(props)) {
        if (key.startsWith("_meety_user_inputs")) {
            const match = value.match(/=>\s*(\d+)/);
            if (match) {
                const parsedPax = parseInt(match[1], 10);
                if (!isNaN(parsedPax) && parsedPax > 0) pax = parsedPax;
                break;
            }
        }
    }

    // ── Status & activity name ────────────────────────────────────────
    let status = order.financial_status === "paid" ? "CONFIRMED" : "PENDING";
    if (order.cancelled_at) {
        status = "CANCELLED";
    }

    const activityName = firstLineItem?.title || null;

    return {
        shopifyId: order.id.toString(),
        customerName: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || "Consumidor Final",
        customerEmail: order.customer?.email || null,
        customerPhone: order.customer?.phone || null,
        activityDate,
        activityTime,
        activityType: activityName,
        pax,
        status,
        source: "SHOPIFY",
        totalPrice: parseFloat(order.total_price || "0") || 0,
        createdById: "shopify-webhook",
        notes: `Webhook from Shopify Order #${order.order_number || order.id}`,
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
        const { env } = await getCloudflareContext();
        const prisma = await getPrisma();
        const db = (env as any).DB;

        if (topic === "orders/create" || topic === "orders/updated" || topic === "orders/paid") {
            const booking = parseOrderToBooking(order);

            if (db) {
                // Use Raw SQL for Cloudflare D1
                await db.prepare(`
                    INSERT INTO Booking (
                        id, shopifyId, customerName, customerEmail, customerPhone, 
                        activityDate, activityTime, activityType, pax, status, 
                        source, totalPrice, createdById, notes, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(shopifyId) DO UPDATE SET 
                        status = EXCLUDED.status,
                        totalPrice = EXCLUDED.totalPrice,
                        updatedAt = CURRENT_TIMESTAMP
                `).bind(
                    crypto.randomUUID(),
                    booking.shopifyId,
                    booking.customerName,
                    booking.customerEmail,
                    booking.customerPhone,
                    booking.activityDate.toISOString(),
                    booking.activityTime,
                    booking.activityType,
                    booking.pax,
                    booking.status,
                    booking.source,
                    booking.totalPrice,
                    booking.createdById,
                    booking.notes,
                    new Date().toISOString()
                ).run();
                console.log(`Webhook ${topic}: raw SQL upserted booking for order ${order.id}`);
            } else {
                await (prisma as any).booking.upsert({
                    where: { shopifyId: booking.shopifyId },
                    update: { status: booking.status, totalPrice: booking.totalPrice },
                    create: booking,
                });
                console.log(`Webhook ${topic}: Prisma upserted booking for order ${order.id}`);
            }
        } else if (topic === "orders/cancelled") {
            if (db) {
                await db.prepare("UPDATE Booking SET status = 'CANCELLED', updatedAt = ? WHERE shopifyId = ?")
                    .bind(new Date().toISOString(), order.id.toString())
                    .run();
            } else {
                await (prisma as any).booking.updateMany({
                    where: { shopifyId: order.id.toString() },
                    data: { status: "CANCELLED" },
                });
            }
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
