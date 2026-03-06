import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";

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

    const props: Record<string, string> = {};
    if (Array.isArray(properties)) {
        for (const p of properties) {
            if (p && typeof p.name === "string" && typeof p.value === "string") {
                props[p.name] = p.value;
            }
        }
    }

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
    }

    let pax = parseInt(props["_meety_numslots"] || "1", 10);
    if (isNaN(pax) || pax < 1) pax = 1;

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
    const rawBody = await req.text();
    const topic = req.headers.get("x-shopify-topic");
    const hmacHeader = req.headers.get("x-shopify-hmac-sha256") || "";

    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

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
            const bookingData = parseOrderToBooking(order);

            await prisma.booking.upsert({
                where: { shopifyId: bookingData.shopifyId },
                update: {
                    status: bookingData.status,
                    totalPrice: bookingData.totalPrice,
                    activityDate: bookingData.activityDate,
                    activityTime: bookingData.activityTime,
                    activityType: bookingData.activityType,
                    pax: bookingData.pax
                },
                create: bookingData,
            });
            console.log(`Webhook ${topic}: upserted booking for order ${order.id}`);
        } else if (topic === "orders/cancelled") {
            await prisma.booking.updateMany({
                where: { shopifyId: order.id.toString() },
                data: { status: "CANCELLED" },
            });
            console.log(`Webhook orders/cancelled: updated order ${order.id}`);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Shopify webhook processing error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
