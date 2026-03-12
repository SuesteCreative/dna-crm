import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const record = await prisma.concessionDailyNote.findUnique({
    where: { concessionId_date: { concessionId: concession.id, date } },
  });
  return NextResponse.json({ note: record?.note ?? "" });
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { date, note } = await req.json();
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const record = await prisma.concessionDailyNote.upsert({
    where: { concessionId_date: { concessionId: concession.id, date } },
    update: { note: note ?? "" },
    create: { concessionId: concession.id, date, note: note ?? "" },
  });
  return NextResponse.json({ note: record.note });
}
