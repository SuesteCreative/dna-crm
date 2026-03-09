import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({
    where: { slug: params.slug },
    include: {
      spots: { orderBy: { spotNumber: "asc" } },
    },
  });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(concession);
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();
  const body = await req.json();
  const { priceFull, priceMorning, priceAfternoon, priceExtraBed, priceOneBed } = body;
  const updated = await prisma.concession.update({
    where: { slug: params.slug },
    data: {
      ...(priceFull != null && { priceFull: parseFloat(priceFull) }),
      ...(priceMorning != null && { priceMorning: parseFloat(priceMorning) }),
      ...(priceAfternoon != null && { priceAfternoon: parseFloat(priceAfternoon) }),
      ...(priceExtraBed != null && { priceExtraBed: parseFloat(priceExtraBed) }),
      ...(priceOneBed != null && { priceOneBed: parseFloat(priceOneBed) }),
    },
  });
  return NextResponse.json(updated);
}
