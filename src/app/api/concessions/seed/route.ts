import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CONCESSIONS = [
  {
    slug: "tropico",
    name: "Trópico",
    location: "Poente",
    rows: 3,
    cols: 16,
    priceFull: 16.5,
    priceMorning: 11.0,
    priceAfternoon: 11.0,
    priceExtraBed: 7.0,
    priceOneBed: 8.0,
  },
  {
    slug: "subnauta",
    name: "Subnauta",
    location: "Nascente",
    rows: 5,
    cols: 8,
    priceFull: 18.5,
    priceMorning: 12.0,
    priceAfternoon: 12.0,
    priceExtraBed: 8.0,
    priceOneBed: 9.0,
  },
];

export async function POST() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const prisma = await getPrisma();
  const results: string[] = [];

  for (const c of CONCESSIONS) {
    // Upsert concession
    const concession = await prisma.concession.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        name: c.name,
        location: c.location,
        rows: c.rows,
        cols: c.cols,
        priceFull: c.priceFull,
        priceMorning: c.priceMorning,
        priceAfternoon: c.priceAfternoon,
        priceExtraBed: c.priceExtraBed,
        priceOneBed: c.priceOneBed,
      },
    });

    // Check if spots already exist
    const existing = await prisma.concessionSpot.count({
      where: { concessionId: concession.id },
    });

    if (existing === 0) {
      const spots = [];
      let spotNumber = 1;
      for (let row = 0; row < c.rows; row++) {
        for (let col = 0; col < c.cols; col++) {
          spots.push({
            concessionId: concession.id,
            spotNumber,
            row,
            col,
          });
          spotNumber++;
        }
      }
      await prisma.concessionSpot.createMany({ data: spots });
      results.push(`${c.name}: created ${spots.length} spots`);
    } else {
      results.push(`${c.name}: already seeded (${existing} spots)`);
    }
  }

  return NextResponse.json({ success: true, results });
}
