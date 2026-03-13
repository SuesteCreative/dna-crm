import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const date = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
  const prisma = await getPrisma();

  const concession = await prisma.concession.findUnique({ where: { slug: params.slug } });
  if (!concession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const requests = await prisma.staffRequest.findMany({
    where: { concessionId: concession.id, date, status: "PENDING" },
    include: { spot: { select: { spotNumber: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(requests);
}
