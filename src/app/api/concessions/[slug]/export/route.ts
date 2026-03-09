import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
  orange:    "FF7C2D",   // brand orange
  orangeLight:"FFEDD5",
  purple:    "7C3AED",
  purpleLight:"EDE9FE",
  blue:      "2563EB",
  blueLight: "DBEAFE",
  red:       "DC2626",
  redLight:  "FEE2E2",
  yellow:    "D97706",
  yellowLight:"FEF3C7",
  green:     "16A34A",
  greenLight:"DCFCE7",
  grey:      "6B7280",
  greyLight: "F3F4F6",
  headerBg:  "1E1B4B",   // dark indigo header
  white:     "FFFFFF",
  rowAlt:    "F9FAFB",   // subtle alternating row
  sectionBg: "EEF2FF",   // light indigo for section headers
  title:     "0F172A",
};

function hex(color: string) { return { argb: "FF" + color }; }

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const note = searchParams.get("note") ?? "";

  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({
    where: { slug: params.slug },
    include: { spots: { orderBy: { spotNumber: "asc" } } },
  });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.concessionEntry.findMany({
    where: { concessionId: concession.id, date, status: { not: "RELEASED" } },
    include: { spot: true, reservation: true },
  });

  const periodLabel = (p: string) =>
    p === "MORNING" ? "Manhã" : p === "AFTERNOON" ? "Tarde" : "Dia Inteiro";
  const bedLabel = (b: string) =>
    b === "ONE_BED" ? "1 cama" : b === "EXTRA_BED" ? "2 camas + extra" : "2 camas";

  // ── Summary stats ──────────────────────────────────────────────────────────
  const activeEntries = entries.filter((e) => e.status !== "RELEASED");
  const totalSpots = concession.spots.length;
  const occupiedSpotIds = new Set(activeEntries.map((e) => e.spotId));
  const occupiedCount = occupiedSpotIds.size;
  const morningCount  = activeEntries.filter((e) => e.period === "MORNING").length;
  const afternoonCount = activeEntries.filter((e) => e.period === "AFTERNOON").length;
  const fullDayCount  = activeEntries.filter((e) => e.period === "FULL_DAY").length;
  const paidRevenue   = activeEntries.filter((e) => e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
  const unpaidRevenue = activeEntries.filter((e) => !e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
  const reservationRevenue = activeEntries.filter((e) => e.reservationId).reduce((s, e) => s + e.totalPrice, 0);
  const walkInRevenue = activeEntries.filter((e) => !e.reservationId).reduce((s, e) => s + e.totalPrice, 0);
  const carryOvers    = activeEntries.filter((e) => e.isCarryOver);
  const reservationEntryCount = activeEntries.filter((e) => e.reservationId).length;
  const uniqueResIds  = new Set(activeEntries.filter((e) => e.reservationId).map((e) => e.reservationId));
  const reservationCount = uniqueResIds.size;
  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });

  // ── Build workbook ─────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "DNA CRM";
  wb.created = new Date();

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1 — Controlo do Dia
  // ═══════════════════════════════════════════════════════════════════════════
  const ws1 = wb.addWorksheet("Controlo do Dia");
  ws1.columns = [
    { header: "Lugar",      key: "lugar",    width: 7  },
    { header: "Modalidade", key: "modal",    width: 14 },
    { header: "Cliente",    key: "client",   width: 24 },
    { header: "Telefone",   key: "phone",    width: 15 },
    { header: "Camas",      key: "beds",     width: 16 },
    { header: "Pago",       key: "paid",     width: 7  },
    { header: "Preço (€)",  key: "price",    width: 11 },
    { header: "Reserva",    key: "res",      width: 9  },
    { header: "Carry-over", key: "co",       width: 16 },
    { header: "Notas",      key: "notes",    width: 32 },
  ];

  // Title row
  ws1.spliceRows(1, 0, [`CONTROLO DIÁRIO — ${concession.name.toUpperCase()} — ${date}`]);
  ws1.mergeCells(1, 1, 1, 10);
  const titleCell = ws1.getCell(1, 1);
  titleCell.font  = { bold: true, size: 13, color: hex(C.white) };
  titleCell.fill  = { type: "pattern", pattern: "solid", fgColor: hex(C.headerBg) };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws1.getRow(1).height = 26;

  // Header row (row 2 after splice)
  const headerRow = ws1.getRow(2);
  headerRow.eachCell((cell) => {
    cell.font  = { bold: true, color: hex(C.white), size: 10 };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: hex(C.orange) };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { bottom: { style: "medium", color: hex(C.white) } };
  });
  headerRow.height = 20;

  // Data rows
  let dataRowIdx = 3;
  for (const spot of concession.spots) {
    const spotEntries = activeEntries.filter((e) => e.spotId === spot.id);
    const isOdd = (dataRowIdx % 2 === 1);

    if (spotEntries.length === 0) {
      // Free spot
      const row = ws1.getRow(dataRowIdx++);
      row.values = [spot.spotNumber, "Livre", "—", "—", "—", "—", "—", "Não", "—", "—"];
      styleDataRow(row, "free", isOdd);
    } else {
      spotEntries.forEach((entry, idx) => {
        const row = ws1.getRow(dataRowIdx++);
        const isOddInner = (dataRowIdx % 2 === 1);
        row.values = [
          idx === 0 ? spot.spotNumber : "",
          periodLabel(entry.period),
          entry.clientName,
          entry.clientPhone ?? "—",
          bedLabel(entry.bedConfig),
          entry.isPaid ? "✓" : "✗",
          entry.totalPrice > 0 ? entry.totalPrice.toFixed(2) : "0.00",
          entry.reservationId ? "Sim" : "Não",
          entry.isCarryOver ? "Pré-pago" : "—",
          entry.notes ?? "—",
        ];
        const colorKey = entry.isCarryOver ? "carryover"
          : entry.reservationId ? "reserved"
          : entry.period === "MORNING" ? "morning"
          : entry.period === "AFTERNOON" ? "afternoon"
          : "full";
        styleDataRow(row, colorKey, isOddInner);
        // Paid cell colour
        const paidCell = row.getCell(6);
        paidCell.font = { bold: true, color: hex(entry.isPaid ? C.green : C.red) };
      });
    }
  }

  // Freeze header rows
  ws1.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2 — Resumo do Dia
  // ═══════════════════════════════════════════════════════════════════════════
  const ws2 = wb.addWorksheet("Resumo do Dia");
  ws2.columns = [{ key: "label", width: 30 }, { key: "value", width: 22 }];

  // Title
  ws2.addRow([`RESUMO — ${concession.name.toUpperCase()} — ${date}`]);
  ws2.mergeCells(ws2.lastRow!.number, 1, ws2.lastRow!.number, 2);
  styleTitle(ws2.lastRow!);

  ws2.addRow(["Gerado em:", now]);
  styleMetaRow(ws2.lastRow!);
  if (note) {
    ws2.addRow(["Nota do dia:", note]);
    styleMetaRow(ws2.lastRow!);
  }
  ws2.addRow([]);

  // Section: Ocupação
  addSectionHeader(ws2, "OCUPAÇÃO");
  addSummaryRow(ws2, "Total de lugares", totalSpots);
  addSummaryRow(ws2, "Lugares ocupados", occupiedCount, C.orange);
  addSummaryRow(ws2, "Lugares livres", totalSpots - occupiedCount, C.grey);
  ws2.addRow([]);
  addSummaryRow(ws2, "Entradas Manhã",       morningCount,  C.orange);
  addSummaryRow(ws2, "Entradas Tarde",        afternoonCount,C.blue);
  addSummaryRow(ws2, "Entradas Dia Inteiro",  fullDayCount,  C.purple);
  addSummaryRow(ws2, "Total de entradas",     morningCount + afternoonCount + fullDayCount);
  ws2.addRow([]);

  // Section: Receita
  addSectionHeader(ws2, "RECEITA");
  addSummaryRow(ws2, "Receita total", `${(paidRevenue + unpaidRevenue).toFixed(2)} €`, C.orange, true);
  addSummaryRow(ws2, "  → Receita paga",     `${paidRevenue.toFixed(2)} €`,   C.green);
  addSummaryRow(ws2, "  → Receita não paga", `${unpaidRevenue.toFixed(2)} €`, C.red);
  ws2.addRow([]);
  addSummaryRow(ws2, "Receita via reservas", `${reservationRevenue.toFixed(2)} €`);
  addSummaryRow(ws2, "Receita walk-in",      `${walkInRevenue.toFixed(2)} €`);
  ws2.addRow([]);

  // Section: Reservas & Outros
  addSectionHeader(ws2, "RESERVAS & OUTROS");
  addSummaryRow(ws2, "Reservas activas no dia",  reservationCount);
  addSummaryRow(ws2, "Entradas via reserva",     reservationEntryCount);
  addSummaryRow(ws2, "Carry-overs (pré-pago)",   carryOvers.length, C.yellow);

  // ── Output ─────────────────────────────────────────────────────────────────
  const buf = await wb.xlsx.writeBuffer();
  const filename = `controlo-${params.slug}-${date}.xlsx`;
  const uint8 = new Uint8Array(buf as ArrayBuffer);
  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const ROW_COLORS: Record<string, { bg: string; text?: string }> = {
  free:      { bg: C.white,       text: C.grey   },
  morning:   { bg: "FFF7ED",      text: "92400E" },
  afternoon: { bg: "EFF6FF",      text: "1E3A5F" },
  full:      { bg: "F5F3FF",      text: "4C1D95" },
  reserved:  { bg: "FEF2F2",      text: "7F1D1D" },
  carryover: { bg: C.yellowLight, text: "78350F" },
};

function styleDataRow(row: ExcelJS.Row, colorKey: string, isOdd: boolean) {
  const palette = ROW_COLORS[colorKey] ?? ROW_COLORS.free;
  const bgColor = isOdd && palette.bg === C.white ? C.rowAlt : palette.bg;
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: hex(bgColor) };
    cell.font = { size: 9.5, color: hex(palette.text ?? C.title) };
    cell.alignment = { vertical: "middle", horizontal: colNum === 1 || colNum === 7 ? "center" : "left" };
    cell.border = { bottom: { style: "hair", color: hex("E5E7EB") } };
  });
  row.height = 16;
}

function styleTitle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font  = { bold: true, size: 13, color: hex(C.white) };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: hex(C.headerBg) };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  row.height = 26;
}

function styleMetaRow(row: ExcelJS.Row) {
  row.eachCell((cell, colNum) => {
    cell.font = { size: 9.5, italic: colNum === 1, color: hex(C.grey) };
  });
}

function addSectionHeader(ws: ExcelJS.Worksheet, label: string) {
  ws.addRow([label, ""]);
  ws.mergeCells(ws.lastRow!.number, 1, ws.lastRow!.number, 2);
  const row = ws.lastRow!;
  row.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: hex(C.headerBg) };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: hex(C.sectionBg) };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.border = { bottom: { style: "thin", color: hex(C.orange) } };
  });
  row.height = 18;
}

function addSummaryRow(
  ws: ExcelJS.Worksheet,
  label: string,
  value: string | number,
  valueColor?: string,
  bold?: boolean,
) {
  ws.addRow([label, value]);
  const row = ws.lastRow!;
  const labelCell = row.getCell(1);
  const valueCell = row.getCell(2);
  labelCell.font = { size: 10, color: hex(C.title) };
  valueCell.font = { size: 10, bold: bold ?? false, color: hex(valueColor ?? C.title) };
  valueCell.alignment = { horizontal: "right" };
  row.height = 16;
}
