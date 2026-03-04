export const runtime = "edge";

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getToken } from "next-auth/jwt";


export async function POST(req: Request) {
    const token = await getToken({ req: req as any });

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await req.json();
        const booking = await prisma.booking.create({
            data: {
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                activityDate: new Date(data.activityDate),
                activityTime: data.activityTime,
                pax: parseInt(data.pax),
                totalPrice: parseFloat(data.totalPrice || 0),
                createdById: token.id as string,
                source: "MANUAL",
                status: "CONFIRMED",
            },
        });
        return NextResponse.json(booking);
    } catch (error) {
        console.error("Failed to create booking:", error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
