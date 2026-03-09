import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { auth } from "@clerk/nextjs/server";
import { syncShopifyOrders } from "@/lib/shopify";

export async function POST() {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
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
