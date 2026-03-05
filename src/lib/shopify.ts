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
        // Fetching all orders, status=any to capture historical data
        const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/orders.json?status=any&limit=250&fulfillment_status=any&financial_status=any`;
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

            const props: Record<string, string> = {};
            for (const p of properties) props[p.name] = p.value;

            // Meety date/time
            let activityDate: Date;
            let activityTime: string | null = null;
            if (props["_meety_from_time"]) {
                const from = new Date(props["_meety_from_time"]);
                activityDate = from;
                const tz = props["_meety_timezone"] || "Europe/Lisbon";
                activityTime = from.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: tz });
            } else {
                activityDate = new Date(order.created_at);
                for (const p of properties) {
                    const n = p.name.toLowerCase();
                    if (n.includes("date") && !n.startsWith("_meety")) { try { activityDate = new Date(p.value); } catch { } }
                    if (n.includes("time") && !n.startsWith("_meety")) { activityTime = p.value; }
                }
            }

            // Meety pax
            let pax = parseInt(props["_meety_numslots"] || "1") || 1;
            for (const [key, value] of Object.entries(props)) {
                if (key.startsWith("_meety_user_inputs")) {
                    const match = value.match(/=>\s*(\d+)/);
                    if (match) { pax = parseInt(match[1]) || pax; break; }
                }
            }

            await (prisma as any).booking.upsert({
                where: { shopifyId: order.id.toString() },
                update: { status: order.financial_status === "paid" ? "CONFIRMED" : "PENDING" },
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
                    notes: order.line_items?.[0]?.title || null,
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
