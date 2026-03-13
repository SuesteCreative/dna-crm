import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

function lisbonToday() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

function periodBounds(period: string, customStart: string, customEnd: string): { from: string; to: string } {
  const today = lisbonToday();
  if (period === "custom" && customStart && customEnd) return { from: customStart, to: customEnd };
  const d = new Date(today + "T00:00:00");
  if (period === "7d")  { const f = new Date(d); f.setDate(f.getDate() - 6);  return { from: f.toLocaleDateString("sv-SE"), to: today }; }
  if (period === "30d") { const f = new Date(d); f.setDate(f.getDate() - 29); return { from: f.toLocaleDateString("sv-SE"), to: today }; }
  if (period === "90d") { const f = new Date(d); f.setDate(f.getDate() - 89); return { from: f.toLocaleDateString("sv-SE"), to: today }; }
  if (period === "1y")  { const f = new Date(d); f.setFullYear(f.getFullYear() - 1); return { from: f.toLocaleDateString("sv-SE"), to: today }; }
  return { from: "2000-01-01", to: "2099-12-31" }; // all
}

const PERIOD_PT: Record<string, string> = { MORNING: "Manhã", AFTERNOON: "Tarde", FULL_DAY: "Dia Inteiro" };
const BED_PT: Record<string, string>    = { TWO_BEDS: "2 Camas", ONE_BED: "1 Cama", EXTRA_BED: "Cama Extra" };
const DOW_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const prisma = await getPrisma();
  const sp = req.nextUrl.searchParams;
  const period = sp.get("period") ?? "all";
  const { from, to } = periodBounds(period, sp.get("startDate") ?? "", sp.get("endDate") ?? "");

  const concession = await prisma.concession.findUnique({
    where: { slug: params.slug },
    include: { spots: { where: { isActive: true } } },
  });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const totalSpots = concession.spots.length;

  // All entries in period
  const entries = await prisma.concessionEntry.findMany({
    where: { concessionId: concession.id, date: { gte: from, lte: to }, status: { in: ["ACTIVE", "CARRIED_OVER"] } },
    select: { spotId: true, date: true, period: true, clientName: true, bedConfig: true,
              totalPrice: true, isPaid: true, isCarryOver: true, reservationId: true },
  });

  // All reservations in period (overlap)
  const reservations = await prisma.concessionReservation.findMany({
    where: { concessionId: concession.id, startDate: { lte: to }, endDate: { gte: from } },
    select: { id: true, clientName: true, startDate: true, endDate: true, period: true,
              bedConfig: true, totalPrice: true, isPaid: true },
  });

  // ── KPIs ──
  const revenuePaid   = entries.filter(e => e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
  const revenueUnpaid = entries.filter(e => !e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
  const totalEntries  = entries.length;

  // avg daily occupancy
  const dayMap: Record<string, Set<string>> = {};
  for (const e of entries) {
    if (!dayMap[e.date]) dayMap[e.date] = new Set();
    dayMap[e.date].add(e.spotId);
  }
  const daysWithData = Object.values(dayMap);
  const avgOccupancy = daysWithData.length
    ? daysWithData.reduce((s, set) => s + set.size, 0) / daysWithData.length
    : 0;
  const avgOccupancyPct = Math.round((avgOccupancy / totalSpots) * 100);

  // ── Revenue by month ──
  const monthRevMap: Record<string, { revenue: number; entries: number }> = {};
  for (const e of entries) {
    const m = e.date.slice(0, 7); // "2026-03"
    if (!monthRevMap[m]) monthRevMap[m] = { revenue: 0, entries: 0 };
    monthRevMap[m].revenue += e.totalPrice;
    monthRevMap[m].entries++;
  }
  const revenueByMonth = Object.entries(monthRevMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([m, v]) => {
      const [yr, mo] = m.split("-");
      const label = new Date(+yr, +mo - 1, 1).toLocaleDateString("pt-PT", { month: "short", year: "2-digit" });
      return { month: label, revenue: Math.round(v.revenue * 100) / 100, entries: v.entries };
    });

  // ── Period breakdown ──
  const periodMap: Record<string, { count: number; revenue: number }> = {};
  for (const e of entries) {
    if (!periodMap[e.period]) periodMap[e.period] = { count: 0, revenue: 0 };
    periodMap[e.period].count++;
    periodMap[e.period].revenue += e.totalPrice;
  }
  const periodBreakdown = Object.entries(periodMap).map(([p, v]) => ({
    name: PERIOD_PT[p] ?? p,
    count: v.count,
    revenue: Math.round(v.revenue * 100) / 100,
  })).sort((a, b) => b.revenue - a.revenue);

  // ── Bed config breakdown ──
  const bedMap: Record<string, { count: number; revenue: number }> = {};
  for (const e of entries) {
    if (!bedMap[e.bedConfig]) bedMap[e.bedConfig] = { count: 0, revenue: 0 };
    bedMap[e.bedConfig].count++;
    bedMap[e.bedConfig].revenue += e.totalPrice;
  }
  const bedBreakdown = Object.entries(bedMap).map(([b, v]) => ({
    name: BED_PT[b] ?? b,
    count: v.count,
    revenue: Math.round(v.revenue * 100) / 100,
  })).sort((a, b) => b.count - a.count);

  // ── Day of week ──
  const dowMap: number[] = [0, 0, 0, 0, 0, 0, 0];
  const dowRevMap: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const e of entries) {
    const dow = new Date(e.date + "T00:00:00").getDay();
    dowMap[dow]++;
    dowRevMap[dow] += e.totalPrice;
  }
  const salesByDayOfWeek = DOW_PT.map((d, i) => ({
    day: d,
    count: dowMap[i],
    revenue: Math.round(dowRevMap[i] * 100) / 100,
  }));

  // ── Walk-in vs Reservation ──
  const walkInEntries = entries.filter(e => !e.reservationId);
  const reservationEntries = entries.filter(e => e.reservationId);
  const walkInRevenue = walkInEntries.reduce((s, e) => s + e.totalPrice, 0);
  const reservationRevenue = reservationEntries.reduce((s, e) => s + e.totalPrice, 0);

  // ── Discounts from reservations ──
  // discount = floor(days/7) × pricePerDay
  const conc = concession;
  function pricePerDay(r: typeof reservations[0]) {
    if (r.period === "MORNING") return conc.priceMorning;
    if (r.period === "AFTERNOON") return conc.priceAfternoon;
    return conc.priceFull;
  }
  function daysBetween(start: string, end: string) {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  }

  let discountCount = 0;
  let discountTotal = 0;
  for (const r of reservations) {
    const days = daysBetween(r.startDate, r.endDate);
    const freeDays = Math.floor(days / 7);
    if (freeDays > 0) {
      discountCount++;
      discountTotal += freeDays * pricePerDay(r);
    }
  }

  // ── Carry-overs ──
  const carryOvers = entries.filter(e => e.isCarryOver);
  const carryOverRevenue = carryOvers.reduce((s, e) => s + e.totalPrice, 0);

  // ── Top clients (entries + reservations combined) ──
  const clientMap: Record<string, { count: number; revenue: number }> = {};
  for (const e of entries) {
    const k = e.clientName;
    if (!clientMap[k]) clientMap[k] = { count: 0, revenue: 0 };
    clientMap[k].count++;
    clientMap[k].revenue += e.totalPrice;
  }
  const topClients = Object.entries(clientMap)
    .map(([name, v]) => ({ name, count: v.count, revenue: Math.round(v.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return NextResponse.json({
    totalSpots,
    period: { from, to },
    kpis: {
      revenuePaid: Math.round(revenuePaid * 100) / 100,
      revenueUnpaid: Math.round(revenueUnpaid * 100) / 100,
      totalEntries,
      avgOccupancyPct,
      totalReservations: reservations.length,
      discountTotal: Math.round(discountTotal * 100) / 100,
      discountCount,
    },
    revenueByMonth,
    periodBreakdown,
    bedBreakdown,
    salesByDayOfWeek,
    walkInVsReservation: {
      walkIn: { count: walkInEntries.length, revenue: Math.round(walkInRevenue * 100) / 100 },
      reservation: { count: reservationEntries.length, revenue: Math.round(reservationRevenue * 100) / 100 },
    },
    carryOvers: { count: carryOvers.length, revenue: Math.round(carryOverRevenue * 100) / 100 },
    topClients,
  });
}
