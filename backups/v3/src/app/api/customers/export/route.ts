import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

const C = { headerBg: "1E1B4B", orange: "FF7C2D", white: "FFFFFF", grey: "6B7280", title: "0F172A", green: "16A34A", red: "DC2626", rowAlt: "F9FAFB" };
const hex = (c: string) => ({ argb: "FF" + c });

export async function GET() {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Clientes");

    ws.columns = [
        { key: "name",      width: 28 },
        { key: "email",     width: 30 },
        { key: "phone",     width: 18 },
        { key: "country",   width: 16 },
        { key: "source",    width: 12 },
        { key: "optedOut",  width: 14 },
        { key: "notes",     width: 40 },
        { key: "createdAt", width: 18 },
    ];

    // Title
    ws.spliceRows(1, 0, [`BASE DE CLIENTES DNA — ${new Date().toLocaleDateString("pt-PT")}`]);
    ws.mergeCells(1, 1, 1, 8);
    const title = ws.getCell(1, 1);
    title.font = { bold: true, size: 13, color: hex(C.white) };
    title.fill = { type: "pattern", pattern: "solid", fgColor: hex(C.headerBg) };
    title.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 26;

    // Header
    ws.spliceRows(2, 0, ["Nome", "Email", "Telefone", "País", "Origem", "Opt-out", "Notas", "Registado em"]);
    const hdr = ws.getRow(2);
    hdr.eachCell((cell) => {
        cell.font = { bold: true, color: hex(C.white), size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: hex(C.orange) };
        cell.alignment = { horizontal: "center", vertical: "middle" };
    });
    hdr.height = 20;
    ws.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

    let rowIdx = 3;
    for (const c of customers) {
        const row = ws.getRow(rowIdx);
        row.values = [
            c.name, c.email ?? "", c.phone ?? "", c.country ?? "",
            c.source, c.optedOut ? "Sim" : "Não",
            c.notes ?? "", c.createdAt.toLocaleDateString("pt-PT"),
        ];
        const isOdd = rowIdx % 2 === 1;
        row.eachCell({ includeEmpty: true }, (cell, col) => {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: hex(isOdd ? C.white : C.rowAlt) };
            cell.font = { size: 9.5, color: hex(C.title) };
            cell.alignment = { horizontal: "left", vertical: "middle" };
            cell.border = { bottom: { style: "hair", color: hex("E5E7EB") } };
        });
        if (c.optedOut) {
            row.getCell(6).font = { bold: true, size: 9.5, color: hex(C.red) };
        }
        row.height = 16;
        rowIdx++;
    }

    // Footer total
    const totRow = ws.getRow(rowIdx);
    totRow.values = [`Total: ${customers.length} clientes`, "", "", "", "", `Opt-out: ${customers.filter(c => c.optedOut).length}`];
    totRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: hex("EEF2FF") };
        cell.font = { bold: true, size: 10, color: hex(C.headerBg) };
    });

    const buf = await wb.xlsx.writeBuffer();
    const now = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buf as ArrayBuffer), {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="clientes-dna-${now}.xlsx"`,
        },
    });
}
