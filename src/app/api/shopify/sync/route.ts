import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { syncShopifyOrders } from "@/lib/shopify";


export async function POST() {
    try {
        const prisma = await getPrisma();
        const result = await syncShopifyOrders(prisma as any);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Shopify sync failed:", error);
        return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }
}
