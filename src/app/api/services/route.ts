import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
    try {
        const prisma = await getPrisma();
        const services = await (prisma as any).service.findMany({
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
    try {
        const prisma = await getPrisma();
        const data = await req.json();
        const service = await (prisma as any).service.create({ data });
        return NextResponse.json(service);
    } catch (error) {
        console.error("Failed to create service:", error);
        return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
    }
}
