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
            // Basic sync logic - needs refinement for pax, activity date etc.
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
                    activityDate: new Date(order.created_at), // Placeholder, should be from line item properties
                    pax: 1, // Placeholder
                    status: order.financial_status === "paid" ? "CONFIRMED" : "PENDING",
                    source: "SHOPIFY",
                    totalPrice: parseFloat(order.total_price),
                    createdById: "system", // Should be a system user
                },
            });
        }

        return { success: true, count: orders.length };
    } catch (error) {
        console.error("Error syncing Shopify orders:", error);
        return { success: false, error };
    }
}
