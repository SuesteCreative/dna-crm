import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

function todayLisbon() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;
  const date = req.nextUrl.searchParams.get("date") ?? todayLisbon();
  const prisma = await getPrisma();

  const concession = await prisma.concession.findUnique({
    where: { slug },
    include: { spots: { where: { isActive: true }, orderBy: { spotNumber: "asc" } } },
  });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Source 1: active entries (exclude entries from cancelled reservations)
  const entries = await prisma.concessionEntry.findMany({
    where: {
      concessionId: concession.id,
      date,
      status: "ACTIVE",
      OR: [
        { reservationId: null },
        { reservation: { status: { not: "CANCELLED" } } },
      ],
    },
    select: { spotId: true, period: true },
  });

  // Source 2: active reservations covering this date
  const reservations = await prisma.concessionReservation.findMany({
    where: {
      concessionId: concession.id,
      status: "ACTIVE",
      startDate: { lte: date },
      endDate: { gte: date },
    },
    select: { spotId: true, period: true },
  });

  // Build taken periods map
  const takenMap: Record<string, Set<string>> = {};
  const addTaken = (spotId: string, period: string) => {
    if (!takenMap[spotId]) takenMap[spotId] = new Set();
    takenMap[spotId].add(period);
    if (period === "FULL_DAY") {
      takenMap[spotId].add("MORNING");
      takenMap[spotId].add("AFTERNOON");
    }
  };

  for (const e of entries) addTaken(e.spotId, e.period);
  for (const r of reservations) addTaken(r.spotId, r.period);

  const spots = concession.spots.map((s) => ({
    spotId: s.id,
    spotNumber: s.spotNumber,
    row: s.row,
    col: s.col,
    takenPeriods: Array.from(takenMap[s.id] ?? []),
  }));

  const pricing = {
    priceFull: concession.priceFull,
    priceMorning: concession.priceMorning,
    priceAfternoon: concession.priceAfternoon,
    priceExtraBed: concession.priceExtraBed,
  };

  return NextResponse.json({
    date,
    spots,
    pricing,
    concessionName: concession.name,
    concessionId: concession.id,
  });
}
