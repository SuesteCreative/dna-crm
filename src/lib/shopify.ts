import prisma from "./prisma";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

export async function syncShopifyOrders() {
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
        console.warn("Shopify credentials missing");
        return;
    }

    try {
        const response = await fetch(
            `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/orders.json?status=any`,
            {
                headers: {
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Shopify API error: ${response.statusText}`);
        }

        const data = await response.json();
        const orders = data.orders;

        for (const order of orders) {
            // Look for booking details in line items (standard for Miti/Sesami etc.)
            const firstLineItem = order.line_items[0];
            const properties = firstLineItem?.properties || [];

            let activityDate = new Date(order.created_at);
            let activityTime = null;
            let pax = 1;

            properties.forEach((prop: any) => {
                const name = prop.name.toLowerCase();
                const value = prop.value;

                if (name.includes("date")) activityDate = new Date(value);
                if (name.includes("time")) activityTime = value;
                if (name.includes("people") || name.includes("pax") || name.includes("quant")) {
                    pax = parseInt(value) || 1;
                }
            });

            await prisma.booking.upsert({
                where: { shopifyId: order.id.toString() },
                update: {
                    status: order.financial_status === "paid" ? "CONFIRMED" : "PENDING",
                },
                create: {
                    shopifyId: order.id.toString(),
                    customerName: `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim() || "Consumidor Final",
                    customerEmail: order.customer?.email,
                    customerPhone: order.customer?.phone,
                    activityDate,
                    activityTime,
                    pax,
                    status: order.financial_status === "paid" ? "CONFIRMED" : "PENDING",
                    source: "SHOPIFY",
                    totalPrice: parseFloat(order.total_price),
                    createdById: "system",
                },
            });
        }

        return { success: true, count: orders.length };
    } catch (error) {
        console.error("Error syncing Shopify orders:", error);
        return { success: false, error };
    }
}
