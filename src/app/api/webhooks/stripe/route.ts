import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPrisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
    const { spotId, concessionId, date, period, bedConfig, clientName, clientPhone } =
      session.metadata ?? {};

    if (!spotId || !concessionId || !date || !period || !bedConfig || !clientName) {
      console.error("Webhook: missing metadata fields", session.metadata);
      return NextResponse.json({ ok: true }); // still 200 — don't cause Stripe retries
    }

    const prisma = await getPrisma();

    // Idempotency check
    const existing = await prisma.concessionEntry.findUnique({
      where: { stripeSessionId: session.id },
    });
    if (existing) return NextResponse.json({ ok: true });

    // Conflict check — race condition guard
    const takenPeriods = ["FULL_DAY"];
    if (period === "MORNING") takenPeriods.push("MORNING");
    if (period === "AFTERNOON") takenPeriods.push("AFTERNOON");
    if (period === "FULL_DAY") takenPeriods.push("MORNING", "AFTERNOON");

    const conflicts = await prisma.concessionEntry.findMany({
      where: { spotId, date, status: "ACTIVE", period: { in: takenPeriods } },
    });

    if (conflicts.length > 0) {
      // Auto-refund
      try {
        await stripe.refunds.create({ payment_intent: session.payment_intent as string });
        console.warn(`Auto-refund issued for session ${session.id} — spot ${spotId} taken`);
      } catch (refundErr) {
        console.error("Auto-refund failed:", refundErr);
      }
      return NextResponse.json({ ok: true });
    }

    // Create entry
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

  return NextResponse.json({ ok: true });
}
