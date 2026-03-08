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
  const prisma = await getPrisma();
  const body = await req.json();
  const { clientName, clientPhone, clientEmail, totalPrice, isPaid, notes, status } = body;

  const updated = await prisma.concessionReservation.update({
    where: { id: params.id },
    data: {
      ...(clientName != null && { clientName }),
      ...(clientPhone !== undefined && { clientPhone }),
      ...(clientEmail !== undefined && { clientEmail }),
      ...(totalPrice != null && { totalPrice: parseFloat(totalPrice) }),
      ...(isPaid != null && { isPaid }),
      ...(notes !== undefined && { notes }),
      ...(status != null && { status }),
    },
    include: { spot: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const { sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();
  const today = new Date().toISOString().slice(0, 10);

  // Cancel future entries linked to this reservation
  await prisma.concessionEntry.updateMany({
    where: { reservationId: params.id, date: { gte: today } },
    data: { status: "RELEASED" },
  });

  await prisma.concessionReservation.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });
  return NextResponse.json({ success: true });
}
