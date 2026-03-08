import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = getPrisma();
  const concessions = await prisma.concession.findMany({
    include: { _count: { select: { spots: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(concessions);
}
