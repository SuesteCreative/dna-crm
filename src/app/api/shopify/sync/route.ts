import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { syncShopifyOrders } from "@/lib/shopify";

export async function POST() {
    try {
        const result = await syncShopifyOrders();

        if (!result.success) {
            return NextResponse.json(result, { status: result.error?.includes("401") ? 401 : 500 });
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Shopify sync route error:", error);
        return NextResponse.json({ success: false, error: String(error), count: 0 }, { status: 500 });
    }
}
