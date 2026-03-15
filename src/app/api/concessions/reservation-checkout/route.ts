import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPrisma } from "@/lib/prisma";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function todayLisbon() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

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

/** Returns periods that conflict with a given period (i.e. would block it). */
function conflictingPeriods(period: string): string[] {
  if (period === "MORNING") return ["MORNING", "FULL_DAY"];
  if (period === "AFTERNOON") return ["AFTERNOON", "FULL_DAY"];
  // FULL_DAY
  return ["MORNING", "AFTERNOON", "FULL_DAY"];
}

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientIp(req), "reservation-checkout", 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }

  try {
    const { slug, spotNumber, startDate, endDate, period, extraBed, clientName, clientPhone } =
      await req.json();

    if (!slug || !spotNumber || !startDate || !endDate || !period || !clientName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["MORNING", "AFTERNOON", "FULL_DAY"].includes(period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }
    if (typeof clientName !== "string" || clientName.trim().length === 0 || clientName.length > 100) {
      return NextResponse.json({ error: "Invalid client name" }, { status: 400 });
    }

    const today = todayLisbon();
    if (startDate < today) {
      return NextResponse.json({ error: "Start date cannot be in the past" }, { status: 400 });
    }
    if (endDate < startDate) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const dates = generateDates(startDate, endDate);
    if (dates.length > 60) {
      return NextResponse.json({ error: "Reservation cannot exceed 60 days" }, { status: 400 });
    }

    const prisma = await getPrisma();

    // Look up concession + spot
    const concession = await prisma.concession.findUnique({
      where: { slug },
      include: { spots: { where: { isActive: true } } },
    });
    if (!concession) return NextResponse.json({ error: "Concession not found" }, { status: 404 });

    const spot = await prisma.concessionSpot.findUnique({
      where: { concessionId_spotNumber: { concessionId: concession.id, spotNumber: Number(spotNumber) } },
    });
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

    const blockedPeriods = conflictingPeriods(period);

    // Check availability: entries for any of the dates
    const conflictingEntries = await prisma.concessionEntry.findMany({
      where: {
        spotId: spot.id,
        date: { in: dates },
        status: "ACTIVE",
        period: { in: blockedPeriods },
      },
      select: { date: true },
    });

    // Check availability: overlapping reservations
    const conflictingReservations = await prisma.concessionReservation.findMany({
      where: {
        spotId: spot.id,
        status: "ACTIVE",
        startDate: { lte: endDate },
        endDate: { gte: startDate },
        period: { in: blockedPeriods },
      },
      select: { id: true },
    });

    if (conflictingEntries.length > 0 || conflictingReservations.length > 0) {
      // Find nearby available spots (no conflict for ANY date in range)
      const nearbySpots = await findNearbyAvailable(
        concession.spots,
        spot,
        dates,
        blockedPeriods,
        prisma
      );
      return NextResponse.json(
        { conflict: true, nearbySpots },
        { status: 409 }
      );
    }

    // Calculate price with discount
    const bedConfig = extraBed ? "EXTRA_BED" : "TWO_BEDS";
    const dayPrice =
      period === "MORNING" ? concession.priceMorning :
      period === "AFTERNOON" ? concession.priceAfternoon :
      concession.priceFull;
    const bedExtra = extraBed ? concession.priceExtraBed : 0;
    const days = dates.length;
    const freeDays = Math.floor(days / 7);
    const billableDays = days - freeDays;
    // Extra bed is charged for all days — free-day discount applies to base price only
    const netPrice = billableDays * dayPrice + days * bedExtra;
    const grossPrice = netPrice; // DB prices already include 23% VAT

    // Build labels
    const periodLabel =
      period === "MORNING" ? "Manhã (09h00–14h00)" :
      period === "AFTERNOON" ? "Tarde (14h00–19h00)" : "Dia Inteiro";
    const startFormatted = new Date(startDate + "T12:00:00Z").toLocaleDateString("pt-PT", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const endFormatted = new Date(endDate + "T12:00:00Z").toLocaleDateString("pt-PT", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
    const productName = `${concession.name} — Chapéu ${spotNumber}`;
    const productDescription = `Reserva ${periodLabel} · ${startFormatted}–${endFormatted}${extraBed ? " · Cama Extra" : ""}`;

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
        sessionType: "reservation",
        spotId: spot.id,
        concessionId: concession.id,
        startDate,
        endDate,
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
          startDate,
          endDate,
          period,
          clientName,
          spotNumber: String(spotNumber),
          concessionName: concession.name,
        },
      },
      success_url: `${base}/concessao/book/${slug}/${spotNumber}/success?session_id={CHECKOUT_SESSION_ID}&type=reservation&start=${startDate}&end=${endDate}&period=${period}&days=${days}&freeDays=${freeDays}&total=${grossPrice.toFixed(2)}&name=${encodeURIComponent(clientName)}`,
      cancel_url: `${base}/concessao/book/${slug}/${spotNumber}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Reservation checkout error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}

async function findNearbyAvailable(
  allSpots: { id: string; spotNumber: number; row: number; col: number }[],
  thisSpot: { id: string; row: number; col: number },
  dates: string[],
  blockedPeriods: string[],
  prisma: Awaited<ReturnType<typeof getPrisma>>
): Promise<number[]> {
  const otherSpots = allSpots.filter((s) => s.id !== thisSpot.id);
  if (otherSpots.length === 0) return [];

  const otherIds = otherSpots.map((s) => s.id);

  // Entries conflicting in date range for other spots
  const conflictEntries = await prisma.concessionEntry.findMany({
    where: {
      spotId: { in: otherIds },
      date: { in: dates },
      status: "ACTIVE",
      period: { in: blockedPeriods },
    },
    select: { spotId: true },
  });

  // Reservations conflicting
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  const conflictReservations = await prisma.concessionReservation.findMany({
    where: {
      spotId: { in: otherIds },
      status: "ACTIVE",
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      period: { in: blockedPeriods },
    },
    select: { spotId: true },
  });

  const conflictSpotIds = new Set([
    ...conflictEntries.map((e) => e.spotId),
    ...conflictReservations.map((r) => r.spotId),
  ]);

  return otherSpots
    .filter((s) => !conflictSpotIds.has(s.id))
    .map((s) => ({
      ...s,
      dist: Math.sqrt((s.row - thisSpot.row) ** 2 + (s.col - thisSpot.col) ** 2),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 4)
    .map((s) => s.spotNumber);
}
