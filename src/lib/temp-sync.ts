import { syncShopifyOrders } from "./shopify";
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from root
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function main() {
    console.log("Starting manual sync from lib folder...");
    try {
        const result = await syncShopifyOrders();
        console.log("Sync Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Sync error:", e);
    }
}
main();
