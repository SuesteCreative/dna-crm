import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/concessions/[slug]/blocks?month=2026-03   → all blocks for that month
// GET /api/concessions/[slug]/blocks?date=2026-03-15 → single date check
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM"
  const date = searchParams.get("date");   // "YYYY-MM-DD"

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (date) {
    const block = await prisma.concessionBlock.findUnique({
      where: { concessionId_date: { concessionId: concession.id, date } },
    });
    return NextResponse.json({ blocked: !!block, reason: block?.reason ?? null });
  }

  const where: any = { concessionId: concession.id };
  if (month) where.date = { startsWith: month };

  const blocks = await prisma.concessionBlock.findMany({ where, orderBy: { date: "asc" } });
  return NextResponse.json(blocks);
}

// POST → block a date
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { date, reason } = await req.json();
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const block = await prisma.concessionBlock.upsert({
    where: { concessionId_date: { concessionId: concession.id, date } },
    update: { reason: reason ?? null },
    create: { concessionId: concession.id, date, reason: reason ?? null },
  });
  return NextResponse.json(block);
}

// DELETE → unblock a date
export async function DELETE(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.concessionBlock.deleteMany({
    where: { concessionId: concession.id, date },
  });
  return NextResponse.json({ ok: true });
}
