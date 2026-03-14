import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isSuperAdmin(sessionClaims: any) {
    return (sessionClaims as any)?.metadata?.role === "SUPER_ADMIN";
}

// GET /api/admin/gdpr?q=name_or_email
// Returns a preview of all records found for the search query.
export async function GET(req: Request) {
    const { sessionClaims } = await auth();
    if (!isSuperAdmin(sessionClaims)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
        return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const like = { contains: q, mode: "insensitive" as const };

    const [customers, bookings, entries, reservations, staffRequests] = await Promise.all([
        (prisma as any).customer.findMany({
            where: { deletedAt: null, OR: [{ name: like }, { email: like }, { phone: like }] },
            select: { id: true, name: true, email: true, phone: true, country: true },
        }),
        prisma.booking.findMany({
            where: { deletedAt: null, OR: [{ customerName: like }, { customerEmail: like }, { customerPhone: like }] },
            select: { id: true, customerName: true, customerEmail: true, activityDate: true, activityType: true, totalPrice: true },
        }),
        (prisma as any).concessionEntry.findMany({
            where: { OR: [{ clientName: like }, { clientPhone: like }] },
            select: { id: true, clientName: true, clientPhone: true, date: true, period: true },
        }),
        (prisma as any).concessionReservation.findMany({
            where: { OR: [{ clientName: like }, { clientEmail: like }, { clientPhone: like }] },
            select: { id: true, clientName: true, clientEmail: true, startDate: true, endDate: true },
        }),
        (prisma as any).staffRequest.findMany({
            where: { clientName: like },
            select: { id: true, clientName: true, date: true },
        }),
    ]);

    return NextResponse.json({ customers, bookings, entries, reservations, staffRequests });
}

// POST /api/admin/gdpr
// Permanently erases personal data for the given query.
// Financial records (Booking, ConcessionEntry, ConcessionReservation) are anonymised — not deleted —
// to comply with Portuguese tax law (7-year retention obligation).
export async function POST(req: Request) {
    const { sessionClaims } = await auth();
    if (!isSuperAdmin(sessionClaims)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { q } = await req.json();
    if (!q || q.trim().length < 2) {
        return NextResponse.json({ error: "Query too short" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const like = { contains: q.trim(), mode: "insensitive" as const };

    // Anonymise financial records (keep for tax law, wipe personal identifiers)
    const [bookingsUpdated, entriesUpdated, reservationsUpdated] = await Promise.all([
        prisma.booking.updateMany({
            where: { OR: [{ customerName: like }, { customerEmail: like }, { customerPhone: like }] },
            data: { customerName: "ELIMINADO (RGPD)", customerEmail: null, customerPhone: null },
        }),
        (prisma as any).concessionEntry.updateMany({
            where: { OR: [{ clientName: like }, { clientPhone: like }] },
            data: { clientName: "ELIMINADO (RGPD)", clientPhone: null },
        }),
        (prisma as any).concessionReservation.updateMany({
            where: { OR: [{ clientName: like }, { clientEmail: like }, { clientPhone: like }] },
            data: { clientName: "ELIMINADO (RGPD)", clientPhone: null, clientEmail: null },
        }),
    ]);

    // Hard-delete non-financial records
    const [staffDeleted, customersAnonymised] = await Promise.all([
        (prisma as any).staffRequest.deleteMany({
            where: { clientName: like },
        }),
        // Customer uses soft-delete guard — anonymise instead
        (prisma as any).customer.updateMany({
            where: { deletedAt: null, OR: [{ name: like }, { email: like }, { phone: like }] },
            data: {
                name: "ELIMINADO (RGPD)",
                email: null,
                phone: null,
                country: null,
                notes: null,
                deletedAt: new Date(),
            },
        }),
    ]);

    return NextResponse.json({
        success: true,
        summary: {
            bookingsAnonymised: bookingsUpdated.count,
            concessionEntriesAnonymised: entriesUpdated.count,
            reservationsAnonymised: reservationsUpdated.count,
            staffRequestsDeleted: staffDeleted.count,
            customersAnonymised: customersAnonymised.count,
        },
    });
}
