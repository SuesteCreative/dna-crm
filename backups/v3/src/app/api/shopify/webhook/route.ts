import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { sendBookingQRCode } from "@/lib/email";

// Deployment force update: 2026-03-11 08:50

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
    const totalQuantity = order.line_items?.reduce((s: number, li: any) => s + (li.quantity || 0), 0) || 1;
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

    let activityDate = new Date(order.created_at);
    let activityTime: string | null = null;

    const meetyFromTime = props["_meety_from_time"];
    const meetyDateTime = props["Date & time"];

    if (meetyFromTime) {
        const from = new Date(meetyFromTime);
        if (!isNaN(from.getTime())) {
            activityDate = from;
            activityTime = from.toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Lisbon"
            });
        }
    } else if (meetyDateTime) {
        try {
            const parts = meetyDateTime.split(",");
            if (parts.length >= 2) {
                const monthDay = parts[0].trim();
                const year = parts[1].trim();
                const timePart = parts[2]?.split("-")[0].trim();

                const fullStr = `${monthDay} ${year} ${timePart || "00:00"}`;
                const dt = new Date(fullStr);
                if (!isNaN(dt.getTime())) {
                    activityDate = dt;
                    if (timePart) activityTime = timePart;
                }
            }
        } catch (e) {
            console.warn("Could not parse Meety Date & time string in webhook:", meetyDateTime);
        }
    }

    const slots = parseInt(props["_meety_numslots"] || "0", 10);
    let pax = Math.max(totalQuantity, slots);

    for (const key in props) {
        const val = props[key];
        if (typeof val === 'string' && val.toLowerCase().includes("attending?")) {
            const match = val.match(/=>\s*(\d+)/);
            if (match && match[1]) {
                pax = parseInt(match[1], 10);
                break;
            }
        }
    }

    let status = order.financial_status === "paid" ? "CONFIRMED" : "PENDING";
    if (order.cancelled_at) {
        status = "CANCELLED";
    }

    const activityType = firstLineItem?.variant_title
        ? `${firstLineItem.title} — ${firstLineItem.variant_title}`
        : firstLineItem?.title || "Atividade Shopify";

    const orderNumber = order.order_number ? `#${order.order_number}` : null;

    return {
        shopifyId: order.id.toString(),
        orderNumber,
        customerName: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || order.customer?.email || "Consumidor Final",
        customerEmail: order.customer?.email || null,
        customerPhone: order.customer?.phone || null,
        activityDate,
        activityTime,
        activityType,
        pax,
        quantity: totalQuantity,
        status,
        source: "SHOPIFY",
        totalPrice: parseFloat(order.total_price || "0") || 0,
        createdById: "shopify-webhook",
        notes: `Shopify ${orderNumber || order.id}`,
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

            const createdBooking = await prisma.booking.upsert({
                where: { shopifyId: bookingData.shopifyId },
                update: {
                    status: bookingData.status,
                    totalPrice: bookingData.totalPrice,
                    activityDate: bookingData.activityDate,
                    activityTime: bookingData.activityTime,
                    activityType: bookingData.activityType,
                    pax: bookingData.pax,
                    quantity: bookingData.quantity,
                    orderNumber: bookingData.orderNumber
                },
                create: bookingData,
            });

            // Send QR code for new Shopify bookings
            if (createdBooking.customerEmail && createdBooking.status === "CONFIRMED") {
                sendBookingQRCode(createdBooking).catch(e => console.error("Shopify QR send failed:", e));
            }
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
