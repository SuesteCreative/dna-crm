import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPrisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** Generate all YYYY-MM-DD dates from startDate to endDate inclusive. */
function generateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cur = new Date(startDate + "T12:00:00Z");
  const end = new Date(endDate + "T12:00:00Z");
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
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

    if (sessionType === "reservation") {
      await handleReservationSession(session, meta);
    } else {
      await handleDailySession(session, meta);
    }
  }

  return NextResponse.json({ ok: true });
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

  console.log(
    `Reservation created for spot ${spotId} ${startDate}–${endDate} (${period}) — session ${session.id}. ${dates.length} entries created.`
  );
}
