import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

function lisbonToday() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("sv-SE");
}

function startOfMonth(dateStr: string) {
  return dateStr.slice(0, 8) + "01";
}

function endOfMonth(dateStr: string) {
  const d = new Date(dateStr.slice(0, 7) + "-01T00:00:00");
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("sv-SE");
}

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const prisma = getPrisma();

  const concession = await prisma.concession.findUnique({
    where: { slug: params.slug },
    include: { spots: { where: { isActive: true } } },
  });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const today = lisbonToday();
  const totalSpots = concession.spots.length;

  // --- Today ---
  const todayEntries = await prisma.concessionEntry.findMany({
    where: { concessionId: concession.id, date: today, status: { in: ["ACTIVE", "CARRIED_OVER"] } },
  });

  const todayOccupied = new Set(todayEntries.map((e) => e.spotId)).size;
  const todayRevenuePaid = todayEntries.filter((e) => e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
  const todayRevenueUnpaid = todayEntries.filter((e) => !e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
  const todayCarryOvers = todayEntries.filter((e) => e.isCarryOver).length;
  const todayPeriods = { morning: 0, afternoon: 0, fullDay: 0 };
  for (const e of todayEntries) {
    if (e.period === "MORNING") todayPeriods.morning++;
    else if (e.period === "AFTERNOON") todayPeriods.afternoon++;
    else if (e.period === "FULL_DAY") todayPeriods.fullDay++;
  }

  // --- Next 7 days (today + 6) ---
  const weekStart = today;
  const weekEnd = addDays(today, 6);
  const weekEntries = await prisma.concessionEntry.findMany({
    where: {
      concessionId: concession.id,
      date: { gte: weekStart, lte: weekEnd },
      status: { in: ["ACTIVE", "CARRIED_OVER"] },
    },
  });

  // Group by date
  const weekMap: Record<string, { occupied: Set<string>; revenuePaid: number; revenueUnpaid: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, i);
    weekMap[d] = { occupied: new Set(), revenuePaid: 0, revenueUnpaid: 0 };
  }
  for (const e of weekEntries) {
    if (!weekMap[e.date]) continue;
    weekMap[e.date].occupied.add(e.spotId);
    if (e.isPaid) weekMap[e.date].revenuePaid += e.totalPrice;
    else weekMap[e.date].revenueUnpaid += e.totalPrice;
  }
  const weekDays = Object.entries(weekMap).map(([date, v]) => ({
    date,
    occupied: v.occupied.size,
    occupancyPct: Math.round((v.occupied.size / totalSpots) * 100),
    revenuePaid: v.revenuePaid,
    revenueUnpaid: v.revenueUnpaid,
  }));

  // --- Current month ---
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthEntries = await prisma.concessionEntry.findMany({
    where: {
      concessionId: concession.id,
      date: { gte: monthStart, lte: monthEnd },
      status: { in: ["ACTIVE", "CARRIED_OVER"] },
    },
    select: { spotId: true, date: true, isPaid: true, totalPrice: true },
  });

  const monthRevenuePaid = monthEntries.filter((e) => e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
  const monthRevenueUnpaid = monthEntries.filter((e) => !e.isPaid).reduce((s, e) => s + e.totalPrice, 0);

  // avg daily occupancy
  const monthDayMap: Record<string, Set<string>> = {};
  for (const e of monthEntries) {
    if (!monthDayMap[e.date]) monthDayMap[e.date] = new Set();
    monthDayMap[e.date].add(e.spotId);
  }
  const daysWithData = Object.values(monthDayMap);
  const avgOccupancy = daysWithData.length
    ? Math.round(daysWithData.reduce((s, set) => s + set.size, 0) / daysWithData.length)
    : 0;

  // --- Upcoming reservations (from today forward) ---
  const upcomingReservations = await prisma.concessionReservation.findMany({
    where: { concessionId: concession.id, endDate: { gte: today }, status: "ACTIVE" },
    include: { spot: { select: { spotNumber: true } } },
    orderBy: { startDate: "asc" },
  });

  const upcomingValue = upcomingReservations.reduce((s, r) => s + r.totalPrice, 0);

  return NextResponse.json({
    totalSpots,
    today: {
      date: today,
      occupied: todayOccupied,
      free: totalSpots - todayOccupied,
      occupancyPct: Math.round((todayOccupied / totalSpots) * 100),
      revenuePaid: todayRevenuePaid,
      revenueUnpaid: todayRevenueUnpaid,
      carryOvers: todayCarryOvers,
      periods: todayPeriods,
    },
    week: { days: weekDays },
    month: {
      label: new Date(today + "T00:00:00").toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
      revenuePaid: monthRevenuePaid,
      revenueUnpaid: monthRevenueUnpaid,
      avgOccupancy,
      avgOccupancyPct: Math.round((avgOccupancy / totalSpots) * 100),
    },
    reservations: {
      upcoming: upcomingReservations.map((r) => ({
        id: r.id,
        clientName: r.clientName,
        spotNumber: r.spot.spotNumber,
        startDate: r.startDate,
        endDate: r.endDate,
        period: r.period,
        totalPrice: r.totalPrice,
        isPaid: r.isPaid,
      })),
      count: upcomingReservations.length,
      totalValue: upcomingValue,
    },
  });
}
