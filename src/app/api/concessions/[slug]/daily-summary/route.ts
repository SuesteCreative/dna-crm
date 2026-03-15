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

  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const prisma = await getPrisma();

  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Run all 3 queries in parallel — single DB round-trip set
  const [entries, noteRecord, blockRecord] = await Promise.all([
    prisma.concessionEntry.findMany({
      where: {
        concessionId: concession.id,
        date,
        status: { not: "RELEASED" },
        OR: [
          { reservationId: null },
          { reservation: { status: { not: "CANCELLED" } } },
        ],
      },
      include: { spot: true, reservation: true },
      orderBy: { spot: { spotNumber: "asc" } },
    }),
    prisma.concessionDailyNote.findUnique({
      where: { concessionId_date: { concessionId: concession.id, date } },
    }),
    prisma.concessionBlock.findUnique({
      where: { concessionId_date: { concessionId: concession.id, date } },
    }),
  ]);

  return NextResponse.json({
    entries,
    note: noteRecord?.note ?? "",
    isBlocked: !!blockRecord,
    blockReason: blockRecord?.reason ?? null,
  });
}
