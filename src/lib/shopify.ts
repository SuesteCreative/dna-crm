import { PrismaClient } from "@prisma/client";

export async function syncShopifyOrders(
    prisma: InstanceType<typeof PrismaClient>,
    domain?: string,
    token?: string
) {
    // Read env vars at call time (not module init) so Cloudflare runtime vars are available
    const SHOPIFY_STORE_DOMAIN = domain || process.env.SHOPIFY_STORE_DOMAIN;
    const SHOPIFY_ACCESS_TOKEN = token || process.env.SHOPIFY_ACCESS_TOKEN;

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
        console.warn("Shopify credentials missing", { domain: SHOPIFY_STORE_DOMAIN, hasToken: !!SHOPIFY_ACCESS_TOKEN });
        return { success: false, error: "Shopify credentials missing", count: 0 };
    }

    try {
        const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/orders.json?status=any&limit=250`;
        console.log("Fetching Shopify orders from:", url);

        const response = await fetch(url, {
            headers: {
                "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Shopify API error:", response.status, errText);
            return { success: false, error: `Shopify API ${response.status}: ${response.statusText}`, count: 0 };
        }

        const data = await response.json() as { orders: any[] };
        const orders = data.orders || [];
        console.log(`Got ${orders.length} orders from Shopify`);

        let upserted = 0;
        for (const order of orders) {
            const firstLineItem = order.line_items?.[0];
            const properties = firstLineItem?.properties || [];

            let activityDate = new Date(order.created_at);
            let activityTime: string | null = null;
            let pax = 1;

            properties.forEach((prop: any) => {
                const name = prop.name.toLowerCase();
                const value = prop.value;
                if (name.includes("date")) { try { activityDate = new Date(value); } catch { } }
                if (name.includes("time")) activityTime = value;
                if (name.includes("people") || name.includes("pax") || name.includes("quant")) {
                    pax = parseInt(value) || 1;
                }
            });

            await (prisma as any).booking.upsert({
                where: { shopifyId: order.id.toString() },
                update: {
                    status: order.financial_status === "paid" ? "CONFIRMED" : "PENDING",
                },
                create: {
                    shopifyId: order.id.toString(),
                    customerName: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || "Consumidor Final",
                    customerEmail: order.customer?.email || null,
                    customerPhone: order.customer?.phone || null,
                    activityDate,
                    activityTime,
                    pax,
                    status: order.financial_status === "paid" ? "CONFIRMED" : "PENDING",
                    source: "SHOPIFY",
                    totalPrice: parseFloat(order.total_price),
                    createdById: "shopify-sync",
                },
            });
            upserted++;
        }

        return { success: true, count: upserted };
    } catch (error) {
        console.error("Error syncing Shopify orders:", error);
        return { success: false, error: String(error), count: 0 };
    }
}
