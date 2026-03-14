import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

// Runs nightly at 02:00 UTC via Vercel Cron (vercel.json).
// READ-ONLY — no writes, no deletes. Queries every critical table and
// emails the result as a JSON attachment to RESEND_TO_EMAIL.

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const prisma = await getPrisma();

        // ── Read every critical table (pure SELECT, no side effects) ──────────
        const [
            bookings,
            customers,
            partners,
            services,
            concessions,
            concessionSpots,
            concessionEntries,
            concessionReservations,
            staffRequests,
        ] = await Promise.all([
            prisma.booking.findMany({ orderBy: { createdAt: "desc" } }),
            (prisma as any).customer.findMany({ orderBy: { createdAt: "desc" } }),
            (prisma as any).partner.findMany(),
            (prisma as any).service.findMany(),
            (prisma as any).concession.findMany(),
            (prisma as any).concessionSpot.findMany(),
            (prisma as any).concessionEntry.findMany({ orderBy: { createdAt: "desc" } }),
            (prisma as any).concessionReservation.findMany({ orderBy: { createdAt: "desc" } }),
            (prisma as any).staffRequest.findMany({ orderBy: { createdAt: "desc" } }),
        ]);

        const backupDate = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
        const backupTs = new Date().toISOString();

        const payload = {
            generated: backupTs,
            date: backupDate,
            summary: {
                bookings: bookings.length,
                customers: customers.length,
                partners: partners.length,
                services: services.length,
                concessionEntries: concessionEntries.length,
                concessionReservations: concessionReservations.length,
            },
            data: {
                bookings,
                customers,
                partners,
                services,
                concessions,
                concessionSpots,
                concessionEntries,
                concessionReservations,
                staffRequests,
            },
        };

        const jsonBuffer = Buffer.from(JSON.stringify(payload, null, 2), "utf-8");
        const filename = `dna-crm-backup-${backupDate}.json`;

        // ── Send via Resend ───────────────────────────────────────────────────
        const resendApiKey = process.env.RESEND_API_KEY;
        const toEmail = process.env.RESEND_TO_EMAIL;

        if (!resendApiKey || !toEmail) {
            console.error("Backup: RESEND_API_KEY or RESEND_TO_EMAIL not set");
            return NextResponse.json({ success: false, error: "Email env vars missing" }, { status: 500 });
        }

        const resend = new Resend(resendApiKey);

        const { error } = await resend.emails.send({
            from: "Desportos Náuticos Alvor <nauticos@desportosnauticosalvor.com>",
            to: toEmail,
            subject: `💾 Backup diário CRM — ${backupDate}`,
            attachments: [
                {
                    filename,
                    content: jsonBuffer,
                    contentType: "application/json",
                },
            ],
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #1e293b; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <h2 style="margin-top: 0; color: #0f172a;">💾 Backup Diário — ${backupDate}</h2>
                    <p style="color: #475569;">O backup automático da base de dados foi gerado com sucesso.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 10px 14px; text-align: left; font-size: 13px; color: #64748b;">Tabela</th>
                            <th style="padding: 10px 14px; text-align: right; font-size: 13px; color: #64748b;">Registos</th>
                        </tr>
                        <tr><td style="padding: 9px 14px; font-size: 14px; border-top: 1px solid #f1f5f9;">Reservas (Bookings)</td><td style="padding: 9px 14px; text-align: right; font-size: 14px; font-weight: 600;">${bookings.length}</td></tr>
                        <tr><td style="padding: 9px 14px; font-size: 14px; border-top: 1px solid #f1f5f9;">Clientes</td><td style="padding: 9px 14px; text-align: right; font-size: 14px; font-weight: 600;">${customers.length}</td></tr>
                        <tr><td style="padding: 9px 14px; font-size: 14px; border-top: 1px solid #f1f5f9;">Entradas Concessão</td><td style="padding: 9px 14px; text-align: right; font-size: 14px; font-weight: 600;">${concessionEntries.length}</td></tr>
                        <tr><td style="padding: 9px 14px; font-size: 14px; border-top: 1px solid #f1f5f9;">Reservas Concessão</td><td style="padding: 9px 14px; text-align: right; font-size: 14px; font-weight: 600;">${concessionReservations.length}</td></tr>
                        <tr><td style="padding: 9px 14px; font-size: 14px; border-top: 1px solid #f1f5f9;">Parceiros</td><td style="padding: 9px 14px; text-align: right; font-size: 14px; font-weight: 600;">${partners.length}</td></tr>
                    </table>
                    <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
                        Ficheiro em anexo: <code>${filename}</code><br/>
                        Gerado em: ${backupTs}
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 11px; color: #cbd5e1; text-align: center; margin: 0;">
                        DNA CRM · Backup automático diário às 02:00 UTC
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Backup email failed:", error);
            return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
        }

        console.log(`Backup sent successfully: ${filename} (${jsonBuffer.length} bytes)`);
        return NextResponse.json({
            success: true,
            filename,
            sizeBytes: jsonBuffer.length,
            summary: payload.summary,
        });

    } catch (error) {
        console.error("Backup cron error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
