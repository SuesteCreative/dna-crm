import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const prisma = await getPrisma();
        const data = await req.json();
        const booking = await (prisma as any).booking.create({
            data: {
                customerName: data.customerName,
                customerEmail: data.customerEmail || null,
                customerPhone: data.customerPhone || null,
                activityDate: new Date(data.activityDate),
                activityTime: data.activityTime || null,
                pax: parseInt(data.pax),
                totalPrice: parseFloat(data.totalPrice || 0),
                createdById: userId,
                source: "MANUAL",
                status: "CONFIRMED",
                serviceId: data.serviceId || null,
                activityType: data.activityType || null,
            },
        });
        return NextResponse.json(booking);
    } catch (error) {
        console.error("Failed to create booking:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
