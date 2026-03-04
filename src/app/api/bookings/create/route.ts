import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "edge";

export async function POST(req: Request) {
    // Force some session check
    const session = await getServerSession(authOptions);

    // In local dev without session yet, we might want to bypass for testing, 
    // but for production Cloudflare, auth should be working.
    if (!session) {
        // Checking for a temporary bypass for the very first setup if needed, 
        // but better to enforce security.
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
                createdById: (session.user as any).id,
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
