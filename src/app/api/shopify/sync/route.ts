export const runtime = "edge";

import { NextResponse } from "next/server";
import { syncShopifyOrders } from "@/lib/shopify";


export async function POST() {
    try {
        const result = await syncShopifyOrders();
        return NextResponse.json(result);
    } catch (error) {
        console.error("Shopify sync failed:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
