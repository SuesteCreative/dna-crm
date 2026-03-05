import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// We force Node runtime here because Cloudflare Workers (Edge) 
// sometimes have issues with Prisma introspection or specific Node modules
// although we aren't using 'fs' explicitly, unenv might be triggered by internal libs.
export const runtime = "edge";
export const dynamic = "force-dynamic";

const SERVICES = [
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "10 minutos",
        sku: "001-001",
        price: 40,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/mota.jpg",
        category: "Jetski",
    },
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "15 minutos",
        sku: "001-002",
        price: 55,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/mota.jpg",
        category: "Jetski",
    },
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "20 minutos",
        sku: "001-003",
        price: 65,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/mota.jpg",
        category: "Jetski",
    },
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "30 minutos",
        sku: "001-004",
        price: 85,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/mota.jpg",
        category: "Jetski",
    },
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "1 hora",
        sku: "001-005",
        price: 160,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/mota.jpg",
        category: "Jetski",
    },
    {
        shopifyHandle: "crazy-sofa-inflatable-towable",
        name: "Crazy Sofa",
        variant: "Por pessoa",
        sku: "002-001",
        price: 18,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/CrazySofa-InflatableTowable.png",
        category: "Infláveis",
    },
    {
        shopifyHandle: "banana-slider-inflatable-towable",
        name: "Banana Slider",
        variant: "Por pessoa",
        sku: "002-002",
        price: 18,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/BananaSlider-InflatableTowable.png",
        category: "Infláveis",
    },
];

export async function POST() {
    try {
        const prisma = await getPrisma();
        let seeded = 0;

        for (const svc of SERVICES) {
            await (prisma as any).service.upsert({
                where: { sku: svc.sku },
                update: { price: svc.price, isActive: true },
                create: { ...svc, isActive: true },
            });
            seeded++;
        }

        return NextResponse.json({ success: true, count: seeded });
    } catch (error) {
        console.error("Seed services error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
