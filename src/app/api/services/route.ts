import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
        const prisma = await getPrisma();
        const services = await prisma.service.findMany({
            where: { isActive: true },
            orderBy: [{ category: "asc" }, { price: "asc" }],
        });
        return NextResponse.json(services);
    } catch (error) {
        console.error("Failed to fetch services:", error);
        return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const prisma = await getPrisma();
        const body = await req.json();

        const { name, variant, sku, shopifyHandle, price, imageUrl, category, isActive,
                durationMinutes, slotGapMinutes, unitCapacity, capacityGroup,
                serviceCloseTime, minPax, maxPax, gcalEnabled } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: "name is required" }, { status: 400 });
        }

        const service = await prisma.service.create({
            data: {
                name: name.trim(),
                variant: variant ?? null,
                sku: sku ?? null,
                shopifyHandle: shopifyHandle ?? null,
                price: parseFloat(price) || 0,
                imageUrl: imageUrl ?? null,
                category: category ?? null,
                isActive: isActive ?? true,
                durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
                slotGapMinutes: slotGapMinutes ? parseInt(slotGapMinutes) : undefined,
                unitCapacity: unitCapacity ? parseInt(unitCapacity) : undefined,
                capacityGroup: capacityGroup ?? null,
                serviceCloseTime: serviceCloseTime ?? null,
                minPax: minPax ? parseInt(minPax) : null,
                maxPax: maxPax ? parseInt(maxPax) : null,
                gcalEnabled: gcalEnabled ?? false,
            },
        });
        return NextResponse.json(service);
    } catch (error) {
        console.error("Failed to create service:", error);
        return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
    }
}
