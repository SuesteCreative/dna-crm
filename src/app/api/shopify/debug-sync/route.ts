import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { syncShopifyOrders } from "@/lib/shopify";

export async function GET() {
    try {
        const prisma = await getPrisma();
        const { env } = await getCloudflareContext();

        const domain = (env as any).SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
        const token = (env as any).SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
        const db = (env as any).DB;

        const result = await syncShopifyOrders(prisma as any, domain, token, db);
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: String(error), count: 0 }, { status: 500 });
    }
}
