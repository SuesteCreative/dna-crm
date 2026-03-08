import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
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

// Helper to enumerate all dates in a range (inclusive)
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T12:00:00");
  const endD = new Date(end + "T12:00:00");
  while (cur <= endD) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();
  const body = await req.json();
  const { spotId, clientName, clientPhone, clientEmail, startDate, endDate, period, bedConfig, totalPrice, isPaid, notes } = body;

  if (!spotId || !clientName || !startDate || !endDate || !period) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check for conflicts across the date range
  const dates = dateRange(startDate, endDate);

  // Batch-fetch all relevant entries for the concession across these dates (for conflict + alternatives)
  const allEntries = await prisma.concessionEntry.findMany({
    where: { concessionId: concession.id, date: { in: dates }, status: { not: "RELEASED" } },
  });

  // Build blocked dates per spot for the requested period
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

  const conflictDates = spotBlockedDates[spotId] ?? [];
  if (conflictDates.length > 0) {
    // Compute alternative spots
    const allSpots = await prisma.concessionSpot.findMany({
      where: { concessionId: concession.id, isActive: true, id: { not: spotId } },
      orderBy: { spotNumber: "asc" },
    });
    const alternatives = allSpots
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

  // Create reservation
  const reservation = await prisma.concessionReservation.create({
    data: {
      concessionId: concession.id,
      spotId,
      clientName,
      clientPhone: clientPhone || null,
      clientEmail: clientEmail || null,
      startDate,
      endDate,
      period,
      bedConfig: bedConfig || "TWO_BEDS",
      totalPrice: parseFloat(totalPrice) || 0,
      isPaid: isPaid ?? false,
      notes: notes || null,
    },
    include: { spot: true },
  });

  // Generate daily entries for each date in the range
  const entryData = dates.map(date => ({
    concessionId: concession.id,
    spotId,
    date,
    period,
    clientName,
    clientPhone: clientPhone || null,
    bedConfig: bedConfig || "TWO_BEDS",
    totalPrice: 0, // price is on the reservation, entries are just blockers
    isPaid: true,
    reservationId: reservation.id,
  }));
  await prisma.concessionEntry.createMany({ data: entryData });

  return NextResponse.json(reservation);
}
