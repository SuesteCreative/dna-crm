import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export async function GET() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prisma = await getPrisma();
  const requests = await prisma.staffRequest.findMany({
    where: { status: "PENDING" },
    include: {
      concession: { select: { name: true, slug: true } },
      spot: { select: { spotNumber: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    requests.map((r) => ({
      id: r.id,
      spotNumber: r.spot.spotNumber,
      concessionName: r.concession.name,
      concessionSlug: r.concession.slug,
      requestType: (r as any).requestType ?? "ASSISTANCE",
      clientName: r.clientName,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}
