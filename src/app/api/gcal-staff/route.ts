import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (sessionClaims?.metadata as any)?.role as string | undefined;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const staff = await prisma.gcalStaff.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] });
    return NextResponse.json(staff);
}

export async function POST(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (sessionClaims?.metadata as any)?.role as string | undefined;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, calendarId, serviceId, order } = await req.json();
    if (!name || !calendarId) {
        return NextResponse.json({ error: "name and calendarId required" }, { status: 400 });
    }

    const prisma = await getPrisma();
    const staff = await prisma.gcalStaff.create({
        data: { name, calendarId, serviceId: serviceId || null, order: order ?? 0 },
    });
    return NextResponse.json(staff);
}

export async function DELETE(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (sessionClaims?.metadata as any)?.role as string | undefined;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const prisma = await getPrisma();
    await prisma.gcalStaff.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
