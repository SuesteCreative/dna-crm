import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "edge";

export async function GET() {
    try {
        const bookings = await prisma.booking.findMany({
            orderBy: { activityDate: "desc" },
            include: {
                partner: true,
                createdBy: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });
        return NextResponse.json(bookings);
    } catch (error) {
        console.error("Failed to fetch bookings:", error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}
