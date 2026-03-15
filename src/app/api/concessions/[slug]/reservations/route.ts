import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const clientName = searchParams.get("clientName");
  const spotNumber = searchParams.get("spotNumber");

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const where: any = { concessionId: concession.id };
  if (status) where.status = status;
  if (clientName) where.clientName = { contains: clientName, mode: "insensitive" };
  if (from) where.endDate = { gte: from };
  if (to) where.startDate = { lte: to };
  if (spotNumber) {
    where.spot = { spotNumber: parseInt(spotNumber) };
  }

  const reservations = await prisma.concessionReservation.findMany({
    where,
    include: { spot: true },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json(reservations);
}

// Helper to enumerate all dates in a range (inclusive, Lisbon timezone)
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T12:00:00Z");
  const endD = new Date(end + "T12:00:00Z");
  while (cur <= endD) {
    dates.push(cur.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" }));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (!userId || (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();
  const body = await req.json();
  // spotIds = multi-spot booking (from Calculator); spotId = single spot
  const { spotId, spotIds, clientName, clientPhone, clientEmail, startDate, endDate, period, bedConfig, totalPrice, isPaid, notes } = body;
  const allSpotIds: string[] = spotIds?.length ? spotIds : spotId ? [spotId] : [];

  if (!allSpotIds.length || !clientName || !startDate || !endDate || !period) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dates = dateRange(startDate, endDate);

  // Batch-fetch all relevant entries for the concession across these dates (for conflict + alternatives)
  const allEntries = await prisma.concessionEntry.findMany({
    where: { concessionId: concession.id, date: { in: dates }, status: { not: "RELEASED" } },
  });

  function isConflict(existingPeriod: string, newPeriod: string) {
    return existingPeriod === "FULL_DAY" || existingPeriod === newPeriod || newPeriod === "FULL_DAY";
  }
  const spotBlockedDates: Record<string, string[]> = {};
  for (const e of allEntries) {
    if (isConflict(e.period, period)) {
      if (!spotBlockedDates[e.spotId]) spotBlockedDates[e.spotId] = [];
      spotBlockedDates[e.spotId].push(e.date);
    }
  }

  // Check all spots for conflicts before creating any
  for (const sid of allSpotIds) {
    const conflictDates = spotBlockedDates[sid] ?? [];
    if (conflictDates.length > 0) {
      const spots = await prisma.concessionSpot.findMany({
        where: { concessionId: concession.id, isActive: true, id: { notIn: allSpotIds } },
        orderBy: { spotNumber: "asc" },
      });
      const alternatives = spots
        .map((s) => ({ spotId: s.id, spotNumber: s.spotNumber, blockedDates: spotBlockedDates[s.id] ?? [] }))
        .filter((a) => a.blockedDates.length < dates.length)
        .sort((a, b) => a.blockedDates.length - b.blockedDates.length)
        .slice(0, 6);
      return NextResponse.json({
        error: "CONFLICT",
        message: `Lugar ocupado nos dias: ${conflictDates.join(", ")}`,
        conflictDates,
        alternatives,
      }, { status: 409 });
    }
  }

  // Create all reservations + entries in a single transaction
  const price = parseFloat(totalPrice) || 0;
  const perSpotPrice = allSpotIds.length > 1 ? price / allSpotIds.length : price;
  const reservationData = allSpotIds.map((sid) => ({
    concessionId: concession.id,
    spotId: sid,
    clientName,
    clientPhone: clientPhone || null,
    clientEmail: clientEmail || null,
    startDate,
    endDate,
    period,
    bedConfig: bedConfig || "TWO_BEDS",
    totalPrice: perSpotPrice,
    isPaid: isPaid ?? false,
    notes: notes || null,
  }));

  const created = await prisma.$transaction(async (tx) => {
    const reservations = [];
    for (const rData of reservationData) {
      const reservation = await tx.concessionReservation.create({
        data: rData,
        include: { spot: true },
      });
      await tx.concessionEntry.createMany({
        data: dates.map((date) => ({
          concessionId: concession.id,
          spotId: rData.spotId,
          date,
          period,
          clientName,
          clientPhone: clientPhone || null,
          bedConfig: bedConfig || "TWO_BEDS",
          totalPrice: 0,
          isPaid: true,
          reservationId: reservation.id,
        })),
      });
      reservations.push(reservation);
    }
    return reservations;
  });

  for (const reservation of created) {
    await logAudit({
      userId,
      action: "CREATE",
      module: "CONCESSION_RESERVATION",
      targetId: reservation.id,
      targetName: `L${reservation.spot.spotNumber} - ${clientName}`,
      details: { startDate, endDate, period, totalPrice: perSpotPrice, isPaid, bedConfig },
    });
  }

  return NextResponse.json(created.length === 1 ? created[0] : created);
}
