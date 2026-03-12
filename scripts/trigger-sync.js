const { syncShopifyOrders } = require("../src/lib/shopify");
// We need to polyfill fetch for Node < 18, but user is on 22, so it's fine.
// However, prisma might need the environment.
require("dotenv").config();

async function main() {
    console.log("Triggering Shopify Sync from script...");
    try {
        const result = await syncShopifyOrders();
        console.log("Result:", result);
    } catch (e) {
        console.error("Sync failed:", e);
    }
}

main();
