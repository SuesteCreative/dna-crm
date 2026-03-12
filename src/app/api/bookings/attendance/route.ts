import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role === "PARTNER") return NextResponse.json({ error: "Partners cannot mark attendance" }, { status: 403 });

    try {
        const { id, showedUp } = await req.json();
        if (!id || typeof showedUp !== "boolean") {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const prisma = await getPrisma();
        const current = await prisma.booking.findUnique({
            where: { id },
            include: { activities: true }
        });

        if (!current) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

        let updateData: any = { showedUp };
        
        // If marking as present and total is 0, try to fix it from activities
        if (showedUp && (!current.totalPrice || current.totalPrice === 0) && (current as any).activities.length > 0) {
            const sum = (current as any).activities.reduce((acc: number, act: any) => acc + (act.totalPrice || 0), 0);
            if (sum > 0) {
                const discAmt = (current as any).discountAmount || 0;
                const discType = (current as any).discountType || "%";
                let discounted = sum;
                if (discAmt > 0) {
                    discounted = (discType === "%") ? sum * (1 - discAmt / 100) : sum - discAmt;
                }
                updateData.totalPrice = Math.max(0, discounted);
            }
        }

        const booking = await prisma.booking.update({
            where: { id },
            data: updateData,
            include: { activities: true }
        });

        return NextResponse.json({ success: true, showedUp: booking.showedUp, totalPrice: booking.totalPrice });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
