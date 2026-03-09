import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (!userId || (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();
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

  await logAudit({
    userId,
    action: "UPDATE",
    module: "CONCESSION_ENTRY",
    targetId: entry.id,
    targetName: `L${entry.spot.spotNumber} - ${entry.clientName}`,
    details: { changes: body },
  });

  return NextResponse.json(entry);
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (!userId || (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();
  const entry = await prisma.concessionEntry.update({
    where: { id: params.id },
    data: { status: "RELEASED" },
    include: { spot: true },
  });

  await logAudit({
    userId,
    action: "RELEASE",
    module: "CONCESSION_ENTRY",
    targetId: entry.id,
    targetName: `L${entry.spot.spotNumber} - ${entry.clientName}`,
    details: { reason: "Released space manually" },
  });

  return NextResponse.json({ success: true });
}
