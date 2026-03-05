import { PrismaClient } from "@prisma/client";

export async function syncShopifyOrders(
    prisma: any,
    domain?: string,
    token?: string,
    db?: any // D1Database
) {
    // Read env vars at call time (not module init) so Cloudflare runtime vars are available
    const SHOPIFY_STORE_DOMAIN = domain || process.env.SHOPIFY_STORE_DOMAIN;
    const SHOPIFY_ACCESS_TOKEN = token || process.env.SHOPIFY_ACCESS_TOKEN;

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
        console.warn("Shopify credentials missing", { domain: SHOPIFY_STORE_DOMAIN, hasToken: !!SHOPIFY_ACCESS_TOKEN });
        return { success: false, error: "Shopify credentials missing", count: 0 };
    }

    try {
        // Fetching all orders
        const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/orders.json?status=any&limit=250&fulfillment_status=any&financial_status=any`;
        const response = await fetch(url, {
            headers: {
                "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return { success: false, error: `Shopify API ${response.status}`, count: 0 };
        }

        const data = await response.json() as { orders: any[] };
        const orders = data.orders || [];

        let upserted = 0;
        const failedOrders = [];
        for (const order of orders) {
            try {
                const firstLineItem = order.line_items?.[0];
                const props: Record<string, string> = {};
                if (firstLineItem?.properties) {
                    for (const p of firstLineItem.properties) {
                        if (p.name && p.value) props[p.name] = p.value;
                    }
                }

                // Date/Time parsing
                let activityDate: Date;
                let activityTime: string | null = null;
                if (props["_meety_from_time"]) {
                    const from = new Date(props["_meety_from_time"]);
                    activityDate = isNaN(from.getTime()) ? new Date(order.created_at) : from;
                    if (!isNaN(from.getTime())) {
                        activityTime = from.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Lisbon" });
                    }
                } else {
                    activityDate = new Date(order.created_at);
                }

                // Pax parsing
                let pax = parseInt(props["_meety_numslots"] || "1", 10);
                if (isNaN(pax)) pax = 1;

                const shopifyId = order.id.toString();
                const customerName = `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || "Consumidor Final";
                const status = order.financial_status === "paid" ? "CONFIRMED" : "PENDING";
                const totalPrice = parseFloat(order.total_price) || 0;

                if (db) {
                    // Use Raw SQL for Cloudflare D1 to bypass Prisma filesystem issues
                    await db.prepare(`
                        INSERT INTO Booking (
                            id, shopifyId, customerName, customerEmail, customerPhone, 
                            activityDate, activityTime, activityType, pax, status, 
                            source, totalPrice, createdById, notes, updatedAt
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(shopifyId) DO UPDATE SET 
                            status = EXCLUDED.status,
                            updatedAt = CURRENT_TIMESTAMP
                    `).bind(
                        crypto.randomUUID(),
                        shopifyId,
                        customerName,
                        order.customer?.email || null,
                        order.customer?.phone || null,
                        activityDate.toISOString(),
                        activityTime,
                        firstLineItem?.title || null,
                        pax,
                        status,
                        "SHOPIFY",
                        totalPrice,
                        "shopify-sync",
                        `Synced from Shopify #${order.order_number || order.id}`,
                        new Date().toISOString()
                    ).run();
                } else {
                    // Use Prisma for local development
                    await prisma.booking.upsert({
                        where: { shopifyId },
                        update: { status },
                        create: {
                            shopifyId,
                            customerName,
                            customerEmail: order.customer?.email || null,
                            customerPhone: order.customer?.phone || null,
                            activityDate,
                            activityTime,
                            activityType: firstLineItem?.title || null,
                            pax,
                            status,
                            source: "SHOPIFY",
                            totalPrice,
                            createdById: "shopify-sync",
                            notes: `Synced from Shopify #${order.order_number || order.id}`,
                        },
                    });
                }
                upserted++;
            } catch (err: any) {
                console.error(`Failed order ${order.id}:`, err);
                failedOrders.push({ id: order.id, error: err.message });
            }
        }

        return { success: true, count: upserted, failed: failedOrders.length, failedOrders };
    } catch (error) {
        console.error("Shopify sync error:", error);
        return { success: false, error: String(error), count: 0 };
    }
}
