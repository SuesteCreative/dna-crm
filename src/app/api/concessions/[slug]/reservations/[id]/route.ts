import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T12:00:00");
  const endD = new Date(end + "T12:00:00");
  while (cur <= endD) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function todayLisbon() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (!userId || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();
  const body = await req.json();
  const { clientName, clientPhone, clientEmail, totalPrice, isPaid, notes, status, startDate, endDate, period, bedConfig } = body;

  const existing = await prisma.concessionReservation.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStartDate = startDate ?? existing.startDate;
  const newEndDate = endDate ?? existing.endDate;
  const newPeriod = period ?? existing.period;
  const newBedConfig = bedConfig ?? existing.bedConfig;
  const datesChanged =
    newStartDate !== existing.startDate ||
    newEndDate !== existing.endDate ||
    newPeriod !== existing.period;

  const todayStr = todayLisbon();

  if (datesChanged) {
    // Check conflicts on future dates of the new range (exclude this reservation's own entries)
    const futureDates = dateRange(newStartDate, newEndDate).filter((d) => d >= todayStr);
    if (futureDates.length > 0) {
      const conflictEntries = await prisma.concessionEntry.findMany({
        where: {
          spotId: existing.spotId,
          date: { in: futureDates },
          status: { not: "RELEASED" },
          reservationId: { not: params.id },
        },
      });
      const conflictingDates = conflictEntries
        .filter((e) => e.period === "FULL_DAY" || newPeriod === "FULL_DAY" || e.period === newPeriod)
        .map((e) => e.date);
      if (conflictingDates.length > 0) {
        return NextResponse.json({
          error: "CONFLICT",
          message: `Lugar ocupado nos dias: ${conflictingDates.join(", ")}`,
          conflictDates: conflictingDates,
        }, { status: 409 });
      }
    }

    // Release all existing future entries for this reservation
    await prisma.concessionEntry.updateMany({
      where: { reservationId: params.id, date: { gte: todayStr } },
      data: { status: "RELEASED" },
    });

    // Create new entries for future dates in the new range
    if (futureDates.length > 0) {
      const resolvedClientName = clientName ?? existing.clientName;
      const resolvedClientPhone = clientPhone !== undefined ? clientPhone : existing.clientPhone;
      await prisma.concessionEntry.createMany({
        data: futureDates.map((date) => ({
          concessionId: existing.concessionId,
          spotId: existing.spotId,
          date,
          period: newPeriod,
          clientName: resolvedClientName,
          clientPhone: resolvedClientPhone ?? null,
          bedConfig: newBedConfig,
          totalPrice: 0,
          isPaid: true,
          reservationId: params.id,
        })),
      });
    }
  }

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
      startDate: newStartDate,
      endDate: newEndDate,
      period: newPeriod,
      bedConfig: newBedConfig,
    },
    include: { spot: true },
  });

  await logAudit({
    userId,
    action: "UPDATE",
    module: "CONCESSION_RESERVATION",
    targetId: updated.id,
    targetName: `L${updated.spot.spotNumber} - ${updated.clientName}`,
    details: { changes: body },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string; id: string } }) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  if (!userId || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const prisma = await getPrisma();

  // Release ALL entries linked to this reservation (past and future)
  await prisma.concessionEntry.updateMany({
    where: { reservationId: params.id },
    data: { status: "RELEASED" },
  });

  const reservation = await prisma.concessionReservation.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
    include: { spot: true },
  });

  await logAudit({
    userId,
    action: "CANCEL",
    module: "CONCESSION_RESERVATION",
    targetId: reservation.id,
    targetName: `L${reservation.spot.spotNumber} - ${reservation.clientName}`,
    details: { message: "Reservation and related entries released." },
  });

  return NextResponse.json({ success: true });
}
