import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const format = searchParams.get("format") ?? "xlsx"; // "xlsx" | "json"
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

  // Build full spot list — one row per entry (free spots get one row with "Livre")
  const spotRows: Record<string, any>[] = [];
  for (const spot of concession.spots) {
    const spotEntries = entries.filter((e) => e.spotId === spot.id);
    if (spotEntries.length === 0) {
      spotRows.push({
        Lugar: spot.spotNumber,
        Modalidade: "Livre",
        Cliente: "—",
        Telefone: "—",
        Camas: "—",
        Pago: "—",
        "Preço (€)": "—",
        Reserva: "Não",
        "Carry-over": "—",
        Notas: "—",
      });
    } else {
      spotEntries.forEach((entry, idx) => {
        spotRows.push({
          Lugar: idx === 0 ? spot.spotNumber : "",
          Modalidade: periodLabel(entry.period),
          Cliente: entry.clientName,
          Telefone: entry.clientPhone ?? "—",
          Camas: bedLabel(entry.bedConfig),
          Pago: entry.isPaid ? "✓" : "✗",
          "Preço (€)": entry.totalPrice.toFixed(2),
          Reserva: entry.reservationId ? "Sim" : "Não",
          "Carry-over": entry.isCarryOver ? "Sim (pré-pago)" : "Não",
          Notas: entry.notes ?? "—",
        });
      });
    }
  }

  // Build summary
  const activeEntries = entries.filter((e) => e.status !== "RELEASED");
  const totalSpots = concession.spots.length;
  const occupiedSpotIds = new Set(activeEntries.map((e) => e.spotId));
  const occupiedCount = occupiedSpotIds.size;
  const morningCount = activeEntries.filter((e) => e.period === "MORNING").length;
  const afternoonCount = activeEntries.filter((e) => e.period === "AFTERNOON").length;
  const fullDayCount = activeEntries.filter((e) => e.period === "FULL_DAY").length;
  const paidRevenue = activeEntries.filter((e) => e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
  const unpaidRevenue = activeEntries.filter((e) => !e.isPaid).reduce((s, e) => s + e.totalPrice, 0);
  const reservationRevenue = activeEntries.filter((e) => e.reservationId).reduce((s, e) => s + e.totalPrice, 0);
  const walkInRevenue = activeEntries.filter((e) => !e.reservationId).reduce((s, e) => s + e.totalPrice, 0);
  const carryOvers = activeEntries.filter((e) => e.isCarryOver);
  const reservationEntryCount = activeEntries.filter((e) => e.reservationId).length;
  const uniqueReservationIds = new Set(activeEntries.filter((e) => e.reservationId).map((e) => e.reservationId));
  const reservationCount = uniqueReservationIds.size;

  if (format === "json") {
    return NextResponse.json({
      spots: spotRows,
      summary: {
        date,
        concession: concession.name,
        totalSpots,
        occupiedCount,
        freeCount: totalSpots - occupiedCount,
        morningCount,
        afternoonCount,
        fullDayCount,
        paidRevenue,
        unpaidRevenue,
        totalRevenue: paidRevenue + unpaidRevenue,
        reservationRevenue,
        walkInRevenue,
        carryOverCount: carryOvers.length,
      },
    });
  }

  // Build Excel workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1 — Controlo do Dia
  const ws1 = XLSX.utils.json_to_sheet(spotRows);
  const colWidths = [
    { wch: 6 },  // Lugar
    { wch: 12 }, // Modalidade
    { wch: 22 }, // Cliente
    { wch: 14 }, // Telefone
    { wch: 10 }, // Camas
    { wch: 6 },  // Pago
    { wch: 10 }, // Preço (€)
    { wch: 8 },  // Reserva
    { wch: 18 }, // Carry-over
    { wch: 30 }, // Notas
  ];
  ws1["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws1, "Controlo do Dia");

  // Sheet 2 — Resumo do Dia
  const now = new Date().toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });
  const summaryRows = [
    ["Relatório gerado em:", now],
    [""],
    ["Data", date],
    ["Concessão", concession.name],
    ...(note ? [["Nota do dia", note]] : []),
    [""],
    ["─── OCUPAÇÃO ───────────────────", ""],
    ["Total de lugares", totalSpots],
    ["Lugares ocupados", occupiedCount],
    ["Lugares livres", totalSpots - occupiedCount],
    [""],
    ["Entradas Manhã", morningCount],
    ["Entradas Tarde", afternoonCount],
    ["Entradas Dia Inteiro", fullDayCount],
    ["Total de entradas", morningCount + afternoonCount + fullDayCount],
    [""],
    ["─── RECEITA ─────────────────────", ""],
    ["Receita total", `${(paidRevenue + unpaidRevenue).toFixed(2)}€`],
    ["  → Paga", `${paidRevenue.toFixed(2)}€`],
    ["  → Não paga", `${unpaidRevenue.toFixed(2)}€`],
    [""],
    ["Receita de reservas", `${reservationRevenue.toFixed(2)}€`],
    ["Receita walk-in", `${walkInRevenue.toFixed(2)}€`],
    [""],
    ["─── RESERVAS & OUTROS ──────────", ""],
    ["Reservas activas no dia", reservationCount],
    ["Entradas via reserva", reservationEntryCount],
    ["Carry-overs (pré-pago)", carryOvers.length],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws2["!cols"] = [{ wch: 28 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Resumo do Dia");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `controlo-${params.slug}-${date}.xlsx`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
