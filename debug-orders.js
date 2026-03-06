const dotenv = require('dotenv');
dotenv.config();

async function debugOrders() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    console.log(`Debug Shopify Orders for: ${domain}`);

    // Fetch last 5 orders
    const url = `https://${domain}/admin/api/2024-04/orders.json?status=any&limit=5`;

    try {
        const response = await fetch(url, {
            headers: {
                "X-Shopify-Access-Token": token,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`Found ${data.orders?.length || 0} orders.`);
            if (data.orders && data.orders.length > 0) {
                data.orders.forEach(o => {
                    console.log(`- Order #${o.order_number} (${o.id}): ${o.customer?.first_name} ${o.customer?.last_name} | Total: ${o.total_price} | Created: ${o.created_at}`);
                    console.log(`  Line Items: ${o.line_items.map(li => li.title).join(', ')}`);
                });
            }
        } else {
            console.error("Error:", data);
        }
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

debugOrders();
