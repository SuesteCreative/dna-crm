// This library is now Prisma-free to avoid fs.readdir issues on Cloudflare Edge Runtime.
// It uses raw SQL via the D1 database binding for maximum reliability.

export async function syncShopifyOrders(
    domain?: string,
    token?: string,
    db?: any // D1Database binding
) {
    const SHOPIFY_STORE_DOMAIN = domain || process.env.SHOPIFY_STORE_DOMAIN;
    const SHOPIFY_ACCESS_TOKEN = token || process.env.SHOPIFY_ACCESS_TOKEN;

    if (!db) {
        console.error("D1 Database binding missing in syncShopifyOrders");
        return { success: false, error: "Database binding missing", count: 0 };
    }

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
        return { success: false, error: "Shopify credentials missing", count: 0 };
    }

    try {
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

                // Date parsing
                let activityDate: Date;
                let activityTime: string | null = null;
                if (props["_meety_from_time"]) {
                    const from = new Date(props["_meety_from_time"]);
                    activityDate = isNaN(from.getTime()) ? new Date(order.created_at) : from;
                    if (!isNaN(from.getTime())) {
                        activityTime = from.toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/Lisbon"
                        });
                    }
                } else {
                    activityDate = new Date(order.created_at);
                }

                const shopifyId = order.id.toString();
                const customerName = `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || "Consumidor Final";
                const status = order.financial_status === "paid" ? "CONFIRMED" : "PENDING";
                const totalPrice = parseFloat(order.total_price) || 0;
                const pax = parseInt(props["_meety_numslots"] || "1", 10) || 1;

                // Raw SQL Upsert for D1
                await db.prepare(`
                    INSERT INTO Booking (
                        id, shopifyId, customerName, customerEmail, customerPhone, 
                        activityDate, activityTime, activityType, pax, status, 
                        source, totalPrice, createdById, notes, updatedAt, createdAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(shopifyId) DO UPDATE SET 
                        status = EXCLUDED.status,
                        totalPrice = EXCLUDED.totalPrice,
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
                    new Date().toISOString(),
                    new Date(order.created_at).toISOString()
                ).run();

                upserted++;
            } catch (err: any) {
                failedOrders.push({ id: order.id, error: err.message });
            }
        }

        return { success: true, count: upserted, failed: failedOrders.length, failedOrders };
    } catch (error) {
        return { success: false, error: String(error), count: 0 };
    }
}

