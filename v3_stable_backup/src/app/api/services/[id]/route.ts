import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const prisma = await getPrisma();
    const body = await req.json();

    const service = await prisma.service.update({
        where: { id: params.id },
        data: {
            durationMinutes: body.durationMinutes ?? null,
            unitCapacity: body.unitCapacity ?? 1,
            capacityGroup: body.capacityGroup ?? null,
            slotGapMinutes: body.slotGapMinutes ?? 10,
            serviceCloseTime: body.serviceCloseTime ?? null,
            gcalEnabled: body.gcalEnabled ?? false,
            minPax: body.minPax ?? null,
            maxPax: body.maxPax ?? null,
        },
    });

    return NextResponse.json(service);
}
