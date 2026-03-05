import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { syncShopifyOrders } from "@/lib/shopify";

export const runtime = "edge";

export async function POST() {
    try {
        const prisma = await getPrisma();

        // Explicitly pass Cloudflare env vars so they're available at runtime
        let domain: string | undefined;
        let token: string | undefined;
        try {
            const { env } = await getCloudflareContext();
            domain = (env as any).SHOPIFY_STORE_DOMAIN;
            token = (env as any).SHOPIFY_ACCESS_TOKEN;
        } catch {
            // Local dev fallback — use process.env
            domain = process.env.SHOPIFY_STORE_DOMAIN;
            token = process.env.SHOPIFY_ACCESS_TOKEN;
        }

        const result = await syncShopifyOrders(prisma as any, domain, token);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Shopify sync route error:", error);
        return NextResponse.json({ error: String(error), count: 0 }, { status: 500 });
    }
}
