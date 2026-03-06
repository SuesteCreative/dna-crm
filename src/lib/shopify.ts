import { getPrisma } from "./prisma";

export async function syncShopifyOrders(
    domain?: string,
    token?: string
) {
    const SHOPIFY_STORE_DOMAIN = domain || process.env.SHOPIFY_STORE_DOMAIN;
    const SHOPIFY_ACCESS_TOKEN = token || process.env.SHOPIFY_ACCESS_TOKEN;

    const debugInfo = {
        domain: SHOPIFY_STORE_DOMAIN || "MISSING",
        tokenPrefix: SHOPIFY_ACCESS_TOKEN ? SHOPIFY_ACCESS_TOKEN.substring(0, 10) : "MISSING"
    };

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
        return { success: false, error: "Shopify credentials missing", count: 0, debugInfo };
    }

    try {
        console.log("STARTING SYNC - Credentials check:");
        console.log("Domain:", SHOPIFY_STORE_DOMAIN);
        console.log("Token length:", SHOPIFY_ACCESS_TOKEN.length);

        const prisma = await getPrisma();
        // Simplified URL matching the working debug script
        const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/orders.json?status=any&limit=250`;

        console.log("Fetching URL:", url);

        const response = await fetch(url, {
            headers: {
                "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Shopify HTTP Error:", response.status, errorText);
            return { success: false, error: `Shopify API ${response.status}: ${errorText}`, count: 0, debugInfo };
        }

        const data = await response.json() as { orders: any[] };
        const orders = data.orders || [];

        console.log("SUCCESS! Got orders count from Shopify:", orders.length);

        if (orders.length > 0) {
            console.log("First order ID:", orders[0].id);
        }

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

                // Date parsing from Meety properties
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

                await prisma.booking.upsert({
                    where: { shopifyId },
                    update: {
                        status,
                        totalPrice,
                    },
                    create: {
                        shopifyId,
                        customerName,
                        customerEmail: order.customer?.email || null,
                        customerPhone: order.customer?.phone || null,
                        activityDate,
                        activityTime,
                        activityType: firstLineItem?.variant_title
                            ? `${firstLineItem.title} — ${firstLineItem.variant_title}`
                            : firstLineItem?.title || null,
                        pax,
                        status,
                        source: "SHOPIFY",
                        totalPrice,
                        createdById: "shopify-sync",
                        notes: `Shopify #${order.order_number || order.id}`,
                    }
                });

                upserted++;
            } catch (err: any) {
                failedOrders.push({ id: order.id, error: err.message });
            }
        }

        return { success: true, count: upserted, failed: failedOrders.length, failedOrders, debugInfo };
    } catch (error) {
        return { success: false, error: String(error), count: 0, debugInfo };
    }
}

