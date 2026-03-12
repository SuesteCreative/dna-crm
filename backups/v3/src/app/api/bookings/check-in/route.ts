import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "ID da reserva é obrigatório" }, { status: 400 });
    }

    try {
        const prisma = await getPrisma();
        const booking = await prisma.booking.findUnique({
            where: { id },
            select: {
                id: true,
                customerName: true,
                customerEmail: true,
                customerPhone: true,
                activityDate: true,
                activityTime: true,
                pax: true,
                quantity: true,
                totalPrice: true,
                activityType: true,
                showedUp: true,
                status: true,
                source: true,
                notes: true,
                bookingFee: true,
                partner: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!booking) {
            return NextResponse.json({ error: "Reserva não encontrada" }, { status: 404 });
        }

        return NextResponse.json(booking);
    } catch (err: any) {
        console.error("Error fetching check-in info:", err);
        return NextResponse.json({ error: "Erro interno ao procurar reserva" }, { status: 500 });
    }
}
