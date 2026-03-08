import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.concessionEntry.findMany({
    where: {
      concessionId: concession.id,
      date,
      status: { not: "RELEASED" },
    },
    include: { spot: true, reservation: true },
    orderBy: { spot: { spotNumber: "asc" } },
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();
  const body = await req.json();
  const { spotId, date, period, clientName, clientPhone, bedConfig, totalPrice, isPaid, notes } = body;

  if (!spotId || !date || !period || !clientName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Conflict check
  const existing = await prisma.concessionEntry.findMany({
    where: { spotId, date, status: { not: "RELEASED" } },
  });

  for (const e of existing) {
    if (e.period === "FULL_DAY") {
      return NextResponse.json({ error: "CONFLICT", message: "Espaço bloqueado dia inteiro" }, { status: 409 });
    }
    if (period === "FULL_DAY") {
      return NextResponse.json({ error: "CONFLICT", message: "Já existe uma entrada neste espaço" }, { status: 409 });
    }
    if (e.period === period) {
      return NextResponse.json({ error: "CONFLICT", message: `Período ${period} já ocupado` }, { status: 409 });
    }
  }

  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entry = await prisma.concessionEntry.create({
    data: {
      concessionId: concession.id,
      spotId,
      date,
      period,
      clientName,
      clientPhone: clientPhone || null,
      bedConfig: bedConfig || "TWO_BEDS",
      totalPrice: parseFloat(totalPrice) || 0,
      isPaid: isPaid ?? true,
      notes: notes || null,
    },
    include: { spot: true },
  });
  return NextResponse.json(entry);
}
