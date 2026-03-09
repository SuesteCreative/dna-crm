import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/customers/sync
// Scans all Booking records and upserts a Customer for each unique person.
// Dedup strategy: email (preferred) → phone → name (fallback, no merge)
export async function POST() {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prisma = await getPrisma();

    const bookings = await prisma.booking.findMany({
        where: { status: { not: "CANCELLED" } },
        select: { customerName: true, customerEmail: true, customerPhone: true, country: true, source: true },
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const bk of bookings) {
        const name = bk.customerName?.trim();
        if (!name) { skipped++; continue; }

        const email = bk.customerEmail?.trim().toLowerCase() || null;
        const phone = bk.customerPhone?.trim() || null;
        const country = bk.country?.trim() || null;
        const source = bk.source === "SHOPIFY" ? "SHOPIFY" : "BOOKING";

        // Try to find existing customer by email first, then phone
        let existing = null;
        if (email) existing = await prisma.customer.findUnique({ where: { email } });
        if (!existing && phone) existing = await prisma.customer.findFirst({ where: { phone } });

        if (existing) {
            // Update missing fields only (don't overwrite manual data)
            const updates: any = {};
            if (!existing.country && country) updates.country = country;
            if (!existing.phone && phone) updates.phone = phone;
            if (!existing.email && email) updates.email = email;
            if (Object.keys(updates).length > 0) {
                await prisma.customer.update({ where: { id: existing.id }, data: updates });
                updated++;
            } else {
                skipped++;
            }
        } else {
            try {
                await prisma.customer.create({
                    data: { name, email, phone, country, source },
                });
                created++;
            } catch {
                // Unique constraint race — skip
                skipped++;
            }
        }
    }

    return NextResponse.json({ created, updated, skipped, total: created + updated + skipped });
}
