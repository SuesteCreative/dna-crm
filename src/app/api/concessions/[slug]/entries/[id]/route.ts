import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = getPrisma();
  const body = await req.json();
  const { period, clientName, clientPhone, bedConfig, totalPrice, isPaid, notes, status } = body;

  const entry = await prisma.concessionEntry.update({
    where: { id: params.id },
    data: {
      ...(period != null && { period }),
      ...(clientName != null && { clientName }),
      ...(clientPhone !== undefined && { clientPhone }),
      ...(bedConfig != null && { bedConfig }),
      ...(totalPrice != null && { totalPrice: parseFloat(totalPrice) }),
      ...(isPaid != null && { isPaid }),
      ...(notes !== undefined && { notes }),
      ...(status != null && { status }),
    },
    include: { spot: true },
  });
  return NextResponse.json(entry);
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = getPrisma();
  await prisma.concessionEntry.update({
    where: { id: params.id },
    data: { status: "RELEASED" },
  });
  return NextResponse.json({ success: true });
}
