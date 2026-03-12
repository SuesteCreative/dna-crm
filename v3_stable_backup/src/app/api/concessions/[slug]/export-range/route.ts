import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

const C = {
  orange:    "FF7C2D",
  blue:      "2563EB",
  purple:    "7C3AED",
  green:     "16A34A",
  red:       "DC2626",
  yellow:    "D97706",
  grey:      "6B7280",
  headerBg:  "1E1B4B",
  sectionBg: "EEF2FF",
  rowAlt:    "F9FAFB",
  white:     "FFFFFF",
  title:     "0F172A",
};
function hex(c: string) { return { argb: "FF" + c }; }

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from and to required" }, { status: 400 });
  if (from > to) return NextResponse.json({ error: "from must be before to" }, { status: 400 });

  // Cap at 31 days to avoid excessive queries
  const days = dateRange(from, to);
  if (days.length > 31) return NextResponse.json({ error: "Range max 31 days" }, { status: 400 });

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({
    where: { slug: params.slug },
    include: { spots: { orderBy: { spotNumber: "asc" } } },
  });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.concessionEntry.findMany({
    where: {
      concessionId: concession.id,
      date: { gte: from, lte: to },
      status: { not: "RELEASED" },
    },
    include: { spot: true },
    orderBy: [{ date: "asc" }, { spot: { spotNumber: "asc" } }],
  });

  const blocks = await prisma.concessionBlock.findMany({
    where: { concessionId: concession.id, date: { gte: from, lte: to } },
  });
  const blockedDates = new Set(blocks.map((b) => b.date));

  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });

  // ── Build workbook ────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "DNA CRM";
  wb.created = new Date();

  // ═══════════════════ SHEET 1 — Daily Summary ═════════════════════════════
  const ws1 = wb.addWorksheet("Resumo por Dia");
  ws1.columns = [
    { key: "date",        width: 13 },
    { key: "weekday",     width: 12 },
    { key: "blocked",     width: 10 },
    { key: "occupied",    width: 12 },
    { key: "morning",     width: 10 },
    { key: "afternoon",   width: 10 },
    { key: "fullday",     width: 13 },
    { key: "total",       width: 13 },
    { key: "paid",        width: 13 },
    { key: "unpaid",      width: 13 },
    { key: "reservations",width: 12 },
    { key: "walkin",      width: 12 },
  ];

  // Title
  ws1.spliceRows(1, 0, [`RELATÓRIO ${concession.name.toUpperCase()} — ${from} → ${to}`]);
  ws1.mergeCells(1, 1, 1, 12);
  const t1 = ws1.getCell(1, 1);
  t1.font = { bold: true, size: 13, color: hex(C.white) };
  t1.fill = { type: "pattern", pattern: "solid", fgColor: hex(C.headerBg) };
  t1.alignment = { horizontal: "center", vertical: "middle" };
  ws1.getRow(1).height = 26;

  ws1.spliceRows(2, 0, ["Gerado em:", now, "", "", "", "", "", "", "", "", "", ""]);
  ws1.getRow(2).eachCell((cell, col) => {
    cell.font = { size: 9.5, italic: col === 1, color: hex(C.grey) };
  });

  // Header row
  ws1.spliceRows(3, 0, ["Data", "Dia", "Fechado?", "Ocupados", "Manhã", "Tarde", "Dia Inteiro", "Receita Total", "Pago", "Não Pago", "Reservas", "Walk-in"]);
  const hdr1 = ws1.getRow(3);
  hdr1.eachCell((cell) => {
    cell.font = { bold: true, color: hex(C.white), size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: hex(C.orange) };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  hdr1.height = 20;
  ws1.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];

  const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  let totalRevenue = 0, totalPaid = 0, totalUnpaid = 0;
  let totalMorning = 0, totalAfternoon = 0, totalFull = 0, totalOccupied = 0;

  let rowIdx = 4;
  for (const date of days) {
    const dayEntries = entries.filter((e) => e.date === date);
    const isBlocked = blockedDates.has(date);
    const occupied = new Set(dayEntries.map((e) => e.spotId)).size;
    const morning = dayEntries.filter((e) => e.period === "MORNING").length;
    const afternoon = dayEntries.filter((e) => e.period === "AFTERNOON").length;
    const fullday = dayEntries.filter((e) => e.period === "FULL_DAY").length;
    const revenue = dayEntries.reduce((s, e) => s + e.totalPrice, 0);
    const paid = dayEntries.filter((e) => e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
    const unpaid = revenue - paid;
    const resRevenue = dayEntries.filter((e) => e.reservationId).reduce((s, e) => s + e.totalPrice, 0);
    const walkIn = revenue - resRevenue;

    totalRevenue += revenue;
    totalPaid += paid;
    totalUnpaid += unpaid;
    totalMorning += morning;
    totalAfternoon += afternoon;
    totalFull += fullday;
    totalOccupied += occupied;

    const d = new Date(date + "T12:00:00Z");
    const weekday = WEEKDAYS[d.getUTCDay()];
    const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
    const isOdd = rowIdx % 2 === 1;

    const row = ws1.getRow(rowIdx++);
    row.values = [
      date, weekday,
      isBlocked ? "Fechado" : "",
      occupied || "",
      morning || "", afternoon || "", fullday || "",
      revenue > 0 ? revenue.toFixed(2) + " €" : "—",
      paid > 0 ? paid.toFixed(2) + " €" : "—",
      unpaid > 0 ? unpaid.toFixed(2) + " €" : "—",
      resRevenue > 0 ? resRevenue.toFixed(2) + " €" : "—",
      walkIn > 0 ? walkIn.toFixed(2) + " €" : "—",
    ];

    const bg = isBlocked ? "FEE2E2" : isWeekend ? "FFF7ED" : (isOdd ? C.white : "F9FAFB");
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: hex(bg) };
      cell.font = { size: 9.5, color: hex(isBlocked ? C.red : C.title) };
      cell.alignment = { horizontal: col === 1 || col === 2 ? "left" : "center", vertical: "middle" };
      cell.border = { bottom: { style: "hair", color: hex("E5E7EB") } };
    });
    if (isBlocked) {
      row.getCell(3).font = { bold: true, size: 9.5, color: hex(C.red) };
    }
    row.height = 16;
  }

  // Totals row
  const totRow = ws1.getRow(rowIdx);
  totRow.values = ["TOTAL", "", "", totalOccupied, totalMorning, totalAfternoon, totalFull,
    totalRevenue.toFixed(2) + " €", totalPaid.toFixed(2) + " €", totalUnpaid.toFixed(2) + " €", "", ""];
  totRow.eachCell({ includeEmpty: true }, (cell, col) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: hex(C.sectionBg) };
    cell.font = { bold: true, size: 10, color: hex(col === 8 ? C.orange : C.headerBg) };
    cell.alignment = { horizontal: col <= 2 ? "left" : "center", vertical: "middle" };
  });
  totRow.height = 18;

  // ═══════════════════ SHEET 2 — All Entries ═══════════════════════════════
  const ws2 = wb.addWorksheet("Entradas Detalhadas");
  ws2.columns = [
    { key: "date",    width: 13 },
    { key: "lugar",   width: 7  },
    { key: "modal",   width: 14 },
    { key: "client",  width: 24 },
    { key: "phone",   width: 15 },
    { key: "beds",    width: 16 },
    { key: "paid",    width: 7  },
    { key: "price",   width: 11 },
    { key: "res",     width: 9  },
    { key: "co",      width: 14 },
  ];

  ws2.spliceRows(1, 0, [`ENTRADAS DETALHADAS — ${concession.name.toUpperCase()} — ${from} → ${to}`]);
  ws2.mergeCells(1, 1, 1, 10);
  const t2 = ws2.getCell(1, 1);
  t2.font = { bold: true, size: 13, color: hex(C.white) };
  t2.fill = { type: "pattern", pattern: "solid", fgColor: hex(C.headerBg) };
  t2.alignment = { horizontal: "center", vertical: "middle" };
  ws2.getRow(1).height = 26;

  ws2.spliceRows(2, 0, ["Data", "Lugar", "Modalidade", "Cliente", "Telefone", "Camas", "Pago", "Preço (€)", "Reserva", "Carry-over"]);
  const hdr2 = ws2.getRow(2);
  hdr2.eachCell((cell) => {
    cell.font = { bold: true, color: hex(C.white), size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: hex(C.orange) };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  hdr2.height = 20;
  ws2.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

  const periodLabel = (p: string) => p === "MORNING" ? "Manhã" : p === "AFTERNOON" ? "Tarde" : "Dia Inteiro";
  const bedLabel = (b: string) => b === "ONE_BED" ? "1 cama" : b === "EXTRA_BED" ? "2 camas + extra" : "2 camas";

  let detRowIdx = 3;
  for (const e of entries) {
    const row = ws2.getRow(detRowIdx++);
    row.values = [
      e.date, e.spot.spotNumber, periodLabel(e.period),
      e.clientName, e.clientPhone ?? "—", bedLabel(e.bedConfig),
      e.isPaid ? "✓" : "✗", e.totalPrice > 0 ? e.totalPrice.toFixed(2) : "0.00",
      e.reservationId ? "Sim" : "Não", e.isCarryOver ? "Pré-pago" : "—",
    ];
    const isOdd = detRowIdx % 2 === 1;
    const bg = e.isCarryOver ? "FEF3C7" : e.reservationId ? "FEF2F2" : e.period === "MORNING" ? "FFF7ED" : e.period === "AFTERNOON" ? "EFF6FF" : "F5F3FF";
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: hex(isOdd && bg === C.white ? "F9FAFB" : bg) };
      cell.font = { size: 9.5, color: hex(C.title) };
      cell.alignment = { horizontal: col === 2 || col === 8 ? "center" : "left", vertical: "middle" };
      cell.border = { bottom: { style: "hair", color: hex("E5E7EB") } };
    });
    row.getCell(7).font = { bold: true, size: 9.5, color: hex(e.isPaid ? C.green : C.red) };
    row.height = 16;
  }

  const buf = await wb.xlsx.writeBuffer();
  const uint8 = new Uint8Array(buf as ArrayBuffer);
  const filename = `relatorio-${params.slug}-${from}-${to}.xlsx`;
  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
