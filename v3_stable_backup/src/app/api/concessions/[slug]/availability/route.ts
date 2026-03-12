import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/concessions/[slug]/availability?start=YYYY-MM-DD&end=YYYY-MM-DD&period=FULL_DAY&excludeReservationId=...
 * Returns spotIds that are already occupied for at least one day in the range,
 * for the requested period (using the same conflict logic as the entry POST route).
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const period = searchParams.get("period") ?? "FULL_DAY";
  const excludeReservationId = searchParams.get("excludeReservationId");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end required" }, { status: 400 });
  }

  const prisma = await getPrisma();
  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Which periods conflict with the requested period?
  // Mirrors the conflict logic in entries POST route.
  let conflictingPeriods: string[];
  if (period === "FULL_DAY") {
    conflictingPeriods = ["FULL_DAY", "MORNING", "AFTERNOON"];
  } else if (period === "MORNING") {
    conflictingPeriods = ["MORNING", "FULL_DAY"];
  } else {
    // AFTERNOON — only blocked by another AFTERNOON (not by FULL_DAY per current rules)
    conflictingPeriods = ["AFTERNOON"];
  }

  const where: any = {
    concessionId: concession.id,
    date: { gte: start, lte: end },
    status: { not: "RELEASED" },
    period: { in: conflictingPeriods },
  };
  if (excludeReservationId) {
    where.reservationId = { not: excludeReservationId };
  }

  const blockedEntries = await prisma.concessionEntry.findMany({
    where,
    select: { spotId: true },
  });

  const seen = new Set<string>();
  const blockedSpotIds: string[] = [];
  for (const e of blockedEntries) {
    if (!seen.has(e.spotId)) { seen.add(e.spotId); blockedSpotIds.push(e.spotId); }
  }
  return NextResponse.json({ blockedSpotIds });
}
