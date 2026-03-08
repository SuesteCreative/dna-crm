import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/concessions/[slug]/entries/[id]/carry-over
// Body: { targetSpotId, targetDate, bedConfig }
export async function POST(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = getPrisma();
  const body = await req.json();
  const { targetSpotId, targetDate, bedConfig } = body;

  if (!targetSpotId || !targetDate) {
    return NextResponse.json({ error: "Missing targetSpotId or targetDate" }, { status: 400 });
  }

  const original = await prisma.concessionEntry.findUnique({
    where: { id: params.id },
    include: { concession: true, spot: true },
  });
  if (!original) return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  if (original.period !== "FULL_DAY") {
    return NextResponse.json({ error: "Only FULL_DAY entries can be carried over" }, { status: 400 });
  }

  // Check no conflict for target spot on target date
  const conflicts = await prisma.concessionEntry.findMany({
    where: { spotId: targetSpotId, date: targetDate, status: { not: "RELEASED" } },
  });
  const mornConflict = conflicts.some(e => e.period === "MORNING" || e.period === "FULL_DAY");
  if (mornConflict) {
    return NextResponse.json({ error: "CONFLICT", message: "Espaço não disponível de manhã no dia seleccionado" }, { status: 409 });
  }

  const concession = original.concession;
  // Price for carry-over = morning price (already paid as part of full-day, so mark as paid)
  const carryOverPrice = concession.priceMorning;

  // 1. Downgrade original entry to MORNING (was FULL_DAY)
  await prisma.concessionEntry.update({
    where: { id: params.id },
    data: { period: "MORNING", status: "CARRIED_OVER" },
  });

  // 2. Create new MORNING entry for tomorrow on target spot
  const newEntry = await prisma.concessionEntry.create({
    data: {
      concessionId: original.concessionId,
      spotId: targetSpotId,
      date: targetDate,
      period: "MORNING",
      clientName: original.clientName,
      clientPhone: original.clientPhone,
      bedConfig: bedConfig || original.bedConfig,
      totalPrice: carryOverPrice,
      isPaid: true,
      isCarryOver: true,
      notes: `Carry-over de ${original.date}, lugar ${original.spot.spotNumber}`,
    },
    include: { spot: true },
  });

  return NextResponse.json({ success: true, original: { id: params.id, period: "MORNING" }, newEntry });
}
