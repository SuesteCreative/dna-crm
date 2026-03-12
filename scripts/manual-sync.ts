import { syncShopifyOrders } from "../src/lib/shopify";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    console.log("Starting full Shopify sync...");
    try {
        const result = await syncShopifyOrders();
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Sync crashed:", e);
    }
}
main();
