require('dotenv').config();
const { syncShopifyOrders } = require('./src/lib/shopify');

async function testSync() {
    console.log("Starting sync with Supabase...");
    try {
        const result = await syncShopifyOrders();
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Sync error:", e);
    }
}

testSync();
