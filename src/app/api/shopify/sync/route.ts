import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { syncShopifyOrders } from "@/lib/shopify";

export async function POST() {
    try {
        const domain = process.env.SHOPIFY_STORE_DOMAIN;
        const token = process.env.SHOPIFY_ACCESS_TOKEN;

        const result = await syncShopifyOrders(domain, token);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Shopify sync route error:", error);
        return NextResponse.json({ error: String(error), count: 0 }, { status: 500 });
    }
}
