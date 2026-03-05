import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getPrisma } from "@/lib/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { syncShopifyOrders } from "@/lib/shopify";

export async function GET() {
    try {
        const { env } = await getCloudflareContext({ async: true });

        const domain = (env as any).SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
        const token = (env as any).SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_ACCESS_TOKEN;
        const db = (env as any).DB || (env as any).dna_crm_db;

        const result = await syncShopifyOrders(domain, token, db);
        return NextResponse.json({
            ...result,
            debug: {
                hasDb: !!db,
                hasNamedDb: !!(env as any).dna_crm_db,
                availableBindings: Object.keys(env as any),
                domain
            }
        });
    } catch (error) {
        return NextResponse.json({ error: String(error), count: 0 }, { status: 500 });
    }
}
