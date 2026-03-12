import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function adminOnly(role: string | undefined) {
    return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (!adminOnly(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, email, phone, country, notes, optedOut } = body;
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    const prisma = await getPrisma();
    try {
        const customer = await prisma.customer.update({
            where: { id: params.id },
            data: {
                name: name.trim(),
                email: email || null,
                phone: phone || null,
                country: country || null,
                notes: notes || null,
                optedOut: optedOut ?? false,
            },
        });
        return NextResponse.json(customer);
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (!adminOnly(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const prisma = await getPrisma();
    try {
        await prisma.customer.delete({ where: { id: params.id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}
