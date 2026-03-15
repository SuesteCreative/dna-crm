import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPrisma } from "@/lib/prisma";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function todayLisbon() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientIp(req), "checkout", 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }

  try {
    const { slug, spotNumber, period, extraBed, clientName, clientPhone } = await req.json();

    if (!slug || !spotNumber || !period || !clientName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["MORNING", "AFTERNOON", "FULL_DAY"].includes(period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }
    if (typeof clientName !== "string" || clientName.trim().length === 0 || clientName.length > 100) {
      return NextResponse.json({ error: "Invalid client name" }, { status: 400 });
    }

    const date = todayLisbon();
    const prisma = await getPrisma();

    // Look up concession
    const concession = await prisma.concession.findUnique({ where: { slug } });
    if (!concession) return NextResponse.json({ error: "Concession not found" }, { status: 404 });

    // Look up spot
    const spot = await prisma.concessionSpot.findUnique({
      where: { concessionId_spotNumber: { concessionId: concession.id, spotNumber: Number(spotNumber) } },
    });
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

    // Check availability — reject if period already taken
    const takenPeriods = ["FULL_DAY"];
    if (period === "MORNING") takenPeriods.push("MORNING");
    if (period === "AFTERNOON") takenPeriods.push("AFTERNOON");
    if (period === "FULL_DAY") takenPeriods.push("MORNING", "AFTERNOON");

    const conflicts = await prisma.concessionEntry.findMany({
      where: { spotId: spot.id, date, status: "ACTIVE", period: { in: takenPeriods } },
    });
    const reservationConflicts = await prisma.concessionReservation.findMany({
      where: { spotId: spot.id, status: "ACTIVE", startDate: { lte: date }, endDate: { gte: date }, period: { in: takenPeriods } },
    });
    if (conflicts.length > 0 || reservationConflicts.length > 0) {
      return NextResponse.json({ error: "Spot no longer available for this period" }, { status: 409 });
    }

    // Calculate price (net) then apply 23% VAT inclusive
    const bedConfig = extraBed ? "EXTRA_BED" : "TWO_BEDS";
    let netPrice =
      period === "MORNING" ? concession.priceMorning :
      period === "AFTERNOON" ? concession.priceAfternoon :
      concession.priceFull;
    if (bedConfig === "EXTRA_BED") netPrice += concession.priceExtraBed;
    // DB prices are already VAT-inclusive; derive net for accounting records
    const grossPrice = netPrice; // DB prices already include 23% VAT

    // Build labels
    const periodLabel =
      period === "MORNING" ? "Manhã (09h00–14h00)" :
      period === "AFTERNOON" ? "Tarde (14h00–19h00)" : "Dia Inteiro";
    const dateFormatted = new Date(date + "T12:00:00Z").toLocaleDateString("pt-PT", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const productName = `${concession.name} — Chapéu ${spotNumber}`;
    const productDescription = `${periodLabel} · ${dateFormatted}${extraBed ? " · Cama Extra" : ""}`;

    const base = "https://app.desportosnauticosalvor.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      billing_address_collection: "required",
      tax_id_collection: { enabled: false },
      customer_creation: "always",
      custom_fields: [
        {
          key: "tax_id",
          label: { type: "custom", custom: "NIF / VAT Number" },
          type: "text",
          optional: true,
          text: { minimum_length: 7, maximum_length: 15 },
        },
      ],
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: Math.round(grossPrice * 100),
          product_data: {
            name: productName,
            description: productDescription,
          },
        },
        quantity: 1,
      }],
      metadata: {
        sessionType: "daily",
        spotId: spot.id,
        concessionId: concession.id,
        date,
        period,
        bedConfig,
        clientName,
        clientPhone: clientPhone ?? "",
        productName,
        productDescription,
        netAmount: (netPrice / 1.23).toFixed(2),
        grossAmount: grossPrice.toFixed(2),
        vatAmount: (grossPrice - grossPrice / 1.23).toFixed(2),
        vatRate: "23%",
        concessionSlug: slug,
        spotNumber: String(spotNumber),
      },
      payment_intent_data: {
        metadata: {
          productName,
          productDescription,
          netAmount: (netPrice / 1.23).toFixed(2),
          grossAmount: grossPrice.toFixed(2),
          vatAmount: (grossPrice - grossPrice / 1.23).toFixed(2),
          vatRate: "23%",
          date,
          period,
          clientName,
          spotNumber: String(spotNumber),
          concessionName: concession.name,
        },
      },
      success_url: `${base}/concessao/book/${slug}/${spotNumber}/success?session_id={CHECKOUT_SESSION_ID}&type=daily&date=${date}&period=${period}&total=${grossPrice.toFixed(2)}&name=${encodeURIComponent(clientName)}`,
      cancel_url: `${base}/concessao/book/${slug}/${spotNumber}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
