import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

function adminOnly(role: string | undefined) {
    return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function POST(req: NextRequest) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (!adminOnly(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

    const arrayBuf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(arrayBuf as ArrayBuffer);

    const ws = wb.worksheets[0];
    if (!ws) return NextResponse.json({ error: "Ficheiro sem folhas." }, { status: 400 });

    // Auto-detect header row (first row that has "nome" or "name" in any cell)
    let headerRow = 1;
    let colMap: Record<string, number> = {};

    ws.eachRow((row, rowNum) => {
        if (Object.keys(colMap).length > 0) return;
        const cells = row.values as (string | null)[];
        const lower = cells.map(v => (v ? String(v).toLowerCase().trim() : ""));
        if (lower.some(v => v === "nome" || v === "name")) {
            headerRow = rowNum;
            lower.forEach((v, i) => {
                if (v === "nome" || v === "name") colMap.name = i;
                else if (v === "email") colMap.email = i;
                else if (v === "telefone" || v === "phone" || v === "tel") colMap.phone = i;
                else if (v === "país" || v === "pais" || v === "country" || v === "país/country") colMap.country = i;
                else if (v === "notas" || v === "notes") colMap.notes = i;
                else if (v === "opt-out" || v === "optout" || v === "optedout") colMap.optedOut = i;
            });
        }
    });

    if (!colMap.name) return NextResponse.json({ error: "Coluna 'Nome' não encontrada no ficheiro." }, { status: 400 });

    const rows: { name: string; email?: string; phone?: string; country?: string; notes?: string; optedOut: boolean }[] = [];

    ws.eachRow((row, rowNum) => {
        if (rowNum <= headerRow) return;
        const vals = row.values as any[];
        const name = vals[colMap.name] ? String(vals[colMap.name]).trim() : "";
        if (!name) return;
        const email = colMap.email && vals[colMap.email] ? String(vals[colMap.email]).trim().toLowerCase() : undefined;
        const phone = colMap.phone && vals[colMap.phone] ? String(vals[colMap.phone]).trim() : undefined;
        const country = colMap.country && vals[colMap.country] ? String(vals[colMap.country]).trim() : undefined;
        const notes = colMap.notes && vals[colMap.notes] ? String(vals[colMap.notes]).trim() : undefined;
        const rawOpt = colMap.optedOut && vals[colMap.optedOut] ? String(vals[colMap.optedOut]).toLowerCase() : "";
        const optedOut = rawOpt === "sim" || rawOpt === "yes" || rawOpt === "true" || rawOpt === "1";
        rows.push({ name, email, phone, country, notes, optedOut });
    });

    if (rows.length === 0) return NextResponse.json({ error: "Nenhuma linha de dados encontrada." }, { status: 400 });

    const prisma = await getPrisma();
    let created = 0, updated = 0, skipped = 0;

    for (const r of rows) {
        try {
            // Try to find by email first, then phone, then skip duplicates
            let existing = r.email ? await prisma.customer.findUnique({ where: { email: r.email } }) : null;
            if (!existing && r.phone) {
                existing = await prisma.customer.findFirst({ where: { phone: r.phone } });
            }

            if (existing) {
                // Only fill missing fields, don't overwrite
                const update: any = {};
                if (!existing.email && r.email) update.email = r.email;
                if (!existing.phone && r.phone) update.phone = r.phone;
                if (!existing.country && r.country) update.country = r.country;
                if (!existing.notes && r.notes) update.notes = r.notes;
                if (r.optedOut) update.optedOut = true;

                if (Object.keys(update).length > 0) {
                    await prisma.customer.update({ where: { id: existing.id }, data: update });
                    updated++;
                } else {
                    skipped++;
                }
            } else {
                await prisma.customer.create({
                    data: {
                        name: r.name,
                        email: r.email || null,
                        phone: r.phone || null,
                        country: r.country || null,
                        notes: r.notes || null,
                        optedOut: r.optedOut,
                        source: "IMPORT",
                    },
                });
                created++;
            }
        } catch {
            skipped++;
        }
    }

    return NextResponse.json({ created, updated, skipped, total: rows.length });
}
