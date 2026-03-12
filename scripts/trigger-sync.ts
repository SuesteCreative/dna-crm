import { syncShopifyOrders } from "../src/lib/shopify";
import "dotenv/config";

async function main() {
    console.log("Starting Shopify sync...");
    const result = await syncShopifyOrders();
    console.log("Sync result:", JSON.stringify(result, null, 2));
}

main().catch(console.error);
