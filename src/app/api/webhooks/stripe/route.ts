import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import { getPrisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** Generate all YYYY-MM-DD dates from startDate to endDate inclusive (Lisbon timezone). */
function generateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cur = new Date(startDate + "T12:00:00Z");
  const end = new Date(endDate + "T12:00:00Z");
  while (cur <= end) {
    dates.push(cur.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" }));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Stripe webhook signature error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};
    const sessionType = meta.sessionType ?? "daily";

    // Attach NIF (filled in by customer) to payment intent metadata
    const nif = session.custom_fields?.find((f) => f.key === "tax_id")?.text?.value ?? "";
    if (nif && session.payment_intent) {
      await stripe.paymentIntents.update(session.payment_intent as string, {
        metadata: { nif },
      });
    }

    if (sessionType === "reservation") {
      await handleReservationSession(session, meta);
    } else {
      await handleDailySession(session, meta);
    }
  }

  return NextResponse.json({ ok: true });
}

// ── Confirmation email ────────────────────────────────────────────────────────

async function sendConfirmationEmail(params: {
  toEmail: string;
  clientName: string;
  spotNumber: string | number;
  concessionName: string;
  dateLabel: string;
  periodLabel: string;
  total: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const resend = new Resend(apiKey);
    const { toEmail, clientName, spotNumber, concessionName, dateLabel, periodLabel, total } = params;
    await resend.emails.send({
      from: "Desportos Náuticos Alvor <nauticos@desportosnauticosalvor.com>",
      to: toEmail,
      subject: `Confirmação de Reserva — ${concessionName} · Chapéu ${spotNumber}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1e293b;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
          <h2 style="margin-top:0;color:#0f172a">✅ Reserva Confirmada / Booking Confirmed</h2>
          <p style="color:#475569">Olá ${clientName} / Hello ${clientName},</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0">
            <tr><td style="padding:10px 14px;font-size:14px;border-top:1px solid #f1f5f9;color:#64748b">Chapéu / Seat</td><td style="padding:10px 14px;font-size:14px;font-weight:600">${concessionName} · Chapéu ${spotNumber}</td></tr>
            <tr><td style="padding:10px 14px;font-size:14px;border-top:1px solid #f1f5f9;color:#64748b">Data / Date</td><td style="padding:10px 14px;font-size:14px;font-weight:600">${dateLabel}</td></tr>
            <tr><td style="padding:10px 14px;font-size:14px;border-top:1px solid #f1f5f9;color:#64748b">Modalidade / Period</td><td style="padding:10px 14px;font-size:14px;font-weight:600">${periodLabel}</td></tr>
            <tr><td style="padding:10px 14px;font-size:14px;border-top:1px solid #f1f5f9;color:#64748b">Total (IVA 23% incl.)</td><td style="padding:10px 14px;font-size:14px;font-weight:700;color:#0f172a">€${total}</td></tr>
          </table>
          <p style="color:#475569;font-size:14px">Pode acomodar-se no seu lugar. / You may take your seat.</p>
          <p style="font-size:12px;color:#94a3b8;margin-top:20px">Desportos Náuticos de Alvor · Praia de Alvor · <a href="https://desportosnauticosalvor.com" style="color:#3b82f6">desportosnauticosalvor.com</a></p>
        </div>
      `,
    });
  } catch (e) {
    console.warn("Confirmation email failed (non-fatal):", e);
  }
}

// ── Daily walk-in session ────────────────────────────────────────────────────

async function handleDailySession(
  session: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { spotId, concessionId, date, period, bedConfig, clientName, clientPhone } = meta;

  if (!spotId || !concessionId || !date || !period || !bedConfig || !clientName) {
    console.error("Webhook (daily): missing metadata fields", meta);
    return;
  }

  const prisma = await getPrisma();

  // Idempotency check
  const existing = await prisma.concessionEntry.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing) return;

  // Conflict check — race condition guard
  const blockedPeriods = ["FULL_DAY"];
  if (period === "MORNING") blockedPeriods.push("MORNING");
  if (period === "AFTERNOON") blockedPeriods.push("AFTERNOON");
  if (period === "FULL_DAY") blockedPeriods.push("MORNING", "AFTERNOON");

  const conflicts = await prisma.concessionEntry.findMany({
    where: { spotId, date, status: "ACTIVE", period: { in: blockedPeriods } },
  });

  if (conflicts.length > 0) {
    try {
      await stripe.refunds.create({ payment_intent: session.payment_intent as string });
      console.warn(`Auto-refund issued for session ${session.id} — spot ${spotId} taken`);
    } catch (refundErr) {
      console.error("Auto-refund failed:", refundErr);
    }
    return;
  }

  await prisma.concessionEntry.create({
    data: {
      concessionId,
      spotId,
      date,
      period,
      bedConfig,
      clientName,
      clientPhone: clientPhone || null,
      totalPrice: (session.amount_total ?? 0) / 100,
      isPaid: true,
      stripeSessionId: session.id,
    },
  });

  const email = session.customer_details?.email;
  if (email) {
    const periodLabel = period === "MORNING" ? "Manhã · 09h–14h / Morning" : period === "AFTERNOON" ? "Tarde · 14h–19h / Afternoon" : "Dia Inteiro · 09h–19h / Full Day";
    const dateLabel = new Date(date + "T12:00:00Z").toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
    await sendConfirmationEmail({
      toEmail: email,
      clientName,
      spotNumber: meta.spotNumber,
      concessionName: meta.concessionSlug === "subnauta" ? "Subnauta" : "Trópico",
      dateLabel,
      periodLabel,
      total: ((session.amount_total ?? 0) / 100).toFixed(2),
    });
  }

  console.log(`Entry created for spot ${spotId} on ${date} (${period}) — session ${session.id}`);
}

// ── Multi-day reservation session ────────────────────────────────────────────

async function handleReservationSession(
  session: Stripe.Checkout.Session,
  meta: Record<string, string>
) {
  const { spotId, concessionId, startDate, endDate, period, bedConfig, clientName, clientPhone } =
    meta;

  if (!spotId || !concessionId || !startDate || !endDate || !period || !bedConfig || !clientName) {
    console.error("Webhook (reservation): missing metadata fields", meta);
    return;
  }

  const prisma = await getPrisma();

  // Idempotency check
  const existing = await prisma.concessionReservation.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing) return;

  const dates = generateDates(startDate, endDate);
  const blockedPeriods =
    period === "MORNING" ? ["MORNING", "FULL_DAY"] :
    period === "AFTERNOON" ? ["AFTERNOON", "FULL_DAY"] :
    ["MORNING", "AFTERNOON", "FULL_DAY"];

  // Race condition guard: re-check all dates
  const conflictEntries = await prisma.concessionEntry.findMany({
    where: {
      spotId,
      date: { in: dates },
      status: "ACTIVE",
      period: { in: blockedPeriods },
    },
  });
  const conflictReservations = await prisma.concessionReservation.findMany({
    where: {
      spotId,
      status: "ACTIVE",
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      period: { in: blockedPeriods },
    },
  });

  if (conflictEntries.length > 0 || conflictReservations.length > 0) {
    try {
      await stripe.refunds.create({ payment_intent: session.payment_intent as string });
      console.warn(`Auto-refund issued for reservation session ${session.id} — spot ${spotId} conflict`);
    } catch (refundErr) {
      console.error("Auto-refund failed:", refundErr);
    }
    return;
  }

  // Create reservation
  const reservation = await prisma.concessionReservation.create({
    data: {
      concessionId,
      spotId,
      clientName,
      clientPhone: clientPhone || null,
      startDate,
      endDate,
      period,
      bedConfig,
      totalPrice: (session.amount_total ?? 0) / 100,
      isPaid: true,
      stripeSessionId: session.id,
      status: "ACTIVE",
    },
  });

  // Create daily entries for each date
  for (const date of dates) {
    await prisma.concessionEntry.create({
      data: {
        concessionId,
        spotId,
        date,
        period,
        bedConfig,
        clientName,
        clientPhone: clientPhone || null,
        totalPrice: 0, // price is on the reservation
        isPaid: true,
        reservationId: reservation.id,
        status: "ACTIVE",
      },
    });
  }

  const email = session.customer_details?.email;
  if (email) {
    const periodLabel = period === "MORNING" ? "Manhã · 09h–14h / Morning" : period === "AFTERNOON" ? "Tarde · 14h–19h / Afternoon" : "Dia Inteiro · 09h–19h / Full Day";
    const startLabel = new Date(startDate + "T12:00:00Z").toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
    const endLabel = new Date(endDate + "T12:00:00Z").toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" });
    await sendConfirmationEmail({
      toEmail: email,
      clientName,
      spotNumber: meta.spotNumber,
      concessionName: meta.concessionSlug === "subnauta" ? "Subnauta" : "Trópico",
      dateLabel: `${startLabel} → ${endLabel} (${dates.length} dias)`,
      periodLabel,
      total: ((session.amount_total ?? 0) / 100).toFixed(2),
    });
  }

  console.log(
    `Reservation created for spot ${spotId} ${startDate}–${endDate} (${period}) — session ${session.id}. ${dates.length} entries created.`
  );
}
