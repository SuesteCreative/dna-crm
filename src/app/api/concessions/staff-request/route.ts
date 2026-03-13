import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { slug, spotNumber, clientName } = await req.json();
    if (!slug || !spotNumber) {
      return NextResponse.json({ error: "Missing slug or spotNumber" }, { status: 400 });
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
        status: "PENDING",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Staff request error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
