import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { syncGcalToCache } from "@/lib/gcal-cache";
import { syncShopifyOrders } from "@/lib/shopify";

export const dynamic = "force-dynamic";

// In-memory debounce — reset on cold start (which is fine: cold start = sync needed)
let lastSyncAt = 0;
const DEBOUNCE_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function POST() {
    // Any signed-in user can trigger this — it's a background housekeeping call
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ skipped: true, reason: "unauthenticated" });

    const now = Date.now();
    if (now - lastSyncAt < DEBOUNCE_MS) {
        return NextResponse.json({ skipped: true, reason: "debounced", nextSyncIn: Math.round((DEBOUNCE_MS - (now - lastSyncAt)) / 60_000) + "m" });
    }

    lastSyncAt = now;

    // Run both syncs in parallel, never throw — this is fire-and-forget from the client
    const [gcalResult, shopifyResult] = await Promise.allSettled([
        syncGcal(),
        syncShopifyOrders(),
    ]);

    return NextResponse.json({
        ok: true,
        gcal: gcalResult.status === "fulfilled" ? gcalResult.value : { error: String((gcalResult as PromiseRejectedResult).reason) },
        shopify: shopifyResult.status === "fulfilled" ? shopifyResult.value : { error: String((shopifyResult as PromiseRejectedResult).reason) },
    });
}

async function syncGcal() {
    const prisma = await getPrisma();

    // Find all unique calendarIds across all GcalStaff rows
    const staffRows = await (prisma as any).gcalStaff.findMany({
        select: { calendarId: true },
        orderBy: { order: "asc" },
    });

    const calendarIds: string[] = [...new Set(staffRows.map((s: any) => s.calendarId as string))];
    if (calendarIds.length === 0) return { synced: 0 };

    const results = await Promise.allSettled(
        calendarIds.map((calId) => syncGcalToCache(calId))
    );

    const synced = results.filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<any>).value.success).length;
    return { synced, total: calendarIds.length };
}
