import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function adminOnly(role: string | undefined) {
    return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(req: NextRequest) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (!adminOnly(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const country = searchParams.get("country") ?? "";
    const optedOut = searchParams.get("optedOut");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
        ];
    }
    if (country) where.country = { equals: country, mode: "insensitive" };
    if (optedOut === "true") where.optedOut = true;
    if (optedOut === "false") where.optedOut = false;

    const prisma = await getPrisma();
    const [customers, total] = await Promise.all([
        prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
        prisma.customer.count({ where }),
    ]);

    return NextResponse.json({ customers, total, page, limit });
}

export async function POST(req: NextRequest) {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (!adminOnly(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, email, phone, country, notes } = body;
    if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

    const prisma = await getPrisma();

    // Check duplicate email
    if (email) {
        const existing = await prisma.customer.findUnique({ where: { email } });
        if (existing) return NextResponse.json({ error: "Email já existe na base de dados." }, { status: 409 });
    }

    const customer = await prisma.customer.create({
        data: { name: name.trim(), email: email || null, phone: phone || null, country: country || null, notes: notes || null, source: "MANUAL" },
    });
    return NextResponse.json(customer, { status: 201 });
}
