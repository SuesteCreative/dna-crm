import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientIp(req), "staff-request", 10, 5 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }

  try {
    const { slug, spotNumber, clientName, requestType } = await req.json();
    if (!slug || !spotNumber) {
      return NextResponse.json({ error: "Missing slug or spotNumber" }, { status: 400 });
    }
    if (clientName !== undefined && (typeof clientName !== "string" || clientName.length > 100)) {
      return NextResponse.json({ error: "Invalid client name" }, { status: 400 });
    }

    const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
    const prisma = await getPrisma();

    const concession = await prisma.concession.findUnique({ where: { slug } });
    if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const spot = await prisma.concessionSpot.findUnique({
      where: { concessionId_spotNumber: { concessionId: concession.id, spotNumber: Number(spotNumber) } },
    });
    if (!spot) return NextResponse.json({ error: "Spot not found" }, { status: 404 });

    await prisma.staffRequest.create({
      data: {
        concessionId: concession.id,
        spotId: spot.id,
        date,
        clientName: clientName || null,
        requestType: requestType === "PAYMENT" ? "PAYMENT" : "ASSISTANCE",
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Staff request error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
