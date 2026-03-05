export const runtime = "edge";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
    let domain: string | undefined;
    let token: string | undefined;
    try {
        const { env } = await getCloudflareContext({ async: true });
        domain = (env as any).SHOPIFY_STORE_DOMAIN;
        token = (env as any).SHOPIFY_ACCESS_TOKEN;
    } catch {
        domain = process.env.SHOPIFY_STORE_DOMAIN;
        token = process.env.SHOPIFY_ACCESS_TOKEN;
    }

    if (!domain || !token) {
        return NextResponse.json({ error: "missing credentials", domain });
    }

    const url = `https://${domain}/admin/api/2024-04/orders.json?status=any&limit=5&fulfillment_status=any&financial_status=any`;
    try {
        const response = await fetch(url, {
            headers: {
                "X-Shopify-Access-Token": token,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: "shopify error", status: response.status, text: await response.text() });
        }

        const data = await response.json() as any;
        return NextResponse.json({
            success: true,
            ordersCount: data.orders?.length || 0,
            firstOrder: data.orders?.[0] ? {
                id: data.orders[0].id,
                created_at: data.orders[0].created_at,
                properties: data.orders[0].line_items?.[0]?.properties
            } : null
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) });
    }
}
