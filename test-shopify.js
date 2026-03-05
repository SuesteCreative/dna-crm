require('dotenv').config();

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function run() {
    const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/orders.json?status=any&limit=250&fulfillment_status=any&financial_status=any`;
    console.log("Fetching", url);
    try {
        const res = await fetch(url, {
            headers: {
                "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
                "Content-Type": "application/json"
            }
        });
        console.log("Status:", res.status);
        const data = await res.json();

        if (data.orders) {
            console.log("Orders found:", data.orders.length);
            for (let i = 0; i < Math.min(3, data.orders.length); i++) {
                const o = data.orders[i];
                console.log(`Order ${o.id}: Status=${o.financial_status}, Date=${o.created_at}`);
                console.log(`  Line item 1 properties:`, JSON.stringify(o.line_items?.[0]?.properties || []));
            }
        } else {
            console.log("Response:", data);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
