import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// Slot configuration based on DNA activity data
// Jetski variants share capacity pool of 3 units
// Crazy Sofa and Banana Slider have 1 unit each
const SLOT_CONFIG: Record<string, { durationMinutes: number; unitCapacity: number; capacityGroup: string | null; slotGapMinutes: number }> = {
    // Jetski - all share JETSKI group (3 physical jetskis)
    "jetski-10": { durationMinutes: 10, unitCapacity: 3, capacityGroup: "JETSKI", slotGapMinutes: 10 },
    "jetski-15": { durationMinutes: 15, unitCapacity: 3, capacityGroup: "JETSKI", slotGapMinutes: 10 },
    "jetski-20": { durationMinutes: 20, unitCapacity: 3, capacityGroup: "JETSKI", slotGapMinutes: 10 },
    "jetski-30": { durationMinutes: 30, unitCapacity: 3, capacityGroup: "JETSKI", slotGapMinutes: 10 },
    "jetski-60": { durationMinutes: 60, unitCapacity: 3, capacityGroup: "JETSKI", slotGapMinutes: 10 },
    // Crazy Sofa - 1 unit
    "crazy-sofa": { durationMinutes: 15, unitCapacity: 1, capacityGroup: null, slotGapMinutes: 10 },
    // Banana Slider - 1 unit
    "banana-slider": { durationMinutes: 15, unitCapacity: 1, capacityGroup: null, slotGapMinutes: 10 },
};

// Name/variant matchers for auto-detection
function detectConfig(name: string, variant: string | null): typeof SLOT_CONFIG[string] | null {
    const n = (name + " " + (variant || "")).toLowerCase();

    if (n.includes("jetski") || n.includes("jet ski") || n.includes("moto de água")) {
        if (n.includes("10") || n.includes("10min") || n.includes("10 min")) return SLOT_CONFIG["jetski-10"];
        if (n.includes("15") || n.includes("15min") || n.includes("15 min")) return SLOT_CONFIG["jetski-15"];
        if (n.includes("20") || n.includes("20min") || n.includes("20 min")) return SLOT_CONFIG["jetski-20"];
        if (n.includes("30") || n.includes("30min") || n.includes("30 min")) return SLOT_CONFIG["jetski-30"];
        if (n.includes("1h") || n.includes("60") || n.includes("1 h") || n.includes("hora")) return SLOT_CONFIG["jetski-60"];
        // Default jetski
        return SLOT_CONFIG["jetski-30"];
    }
    if (n.includes("crazy") || n.includes("sofa")) return SLOT_CONFIG["crazy-sofa"];
    if (n.includes("banana")) return SLOT_CONFIG["banana-slider"];

    return null;
}

export async function POST() {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const prisma = await getPrisma();
    const services = await prisma.service.findMany();

    let updated = 0;
    const results: { name: string; variant: string | null; matched: boolean }[] = [];

    for (const svc of services) {
        const cfg = detectConfig(svc.name, svc.variant);
        if (cfg) {
            await prisma.service.update({
                where: { id: svc.id },
                data: cfg,
            });
            updated++;
            results.push({ name: svc.name, variant: svc.variant, matched: true });
        } else {
            results.push({ name: svc.name, variant: svc.variant, matched: false });
        }
    }

    return NextResponse.json({ updated, results });
}
