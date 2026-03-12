import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

const DEFAULT_SCHEDULE = [
    { dayOfWeek: 0, openTime: "09:30", closeTime: "18:30", isOpen: true },  // Sunday
    { dayOfWeek: 1, openTime: "09:30", closeTime: "18:30", isOpen: true },  // Monday
    { dayOfWeek: 2, openTime: "09:30", closeTime: "18:30", isOpen: true },  // Tuesday
    { dayOfWeek: 3, openTime: "09:30", closeTime: "18:30", isOpen: true },  // Wednesday
    { dayOfWeek: 4, openTime: "09:30", closeTime: "18:30", isOpen: true },  // Thursday
    { dayOfWeek: 5, openTime: "09:30", closeTime: "18:30", isOpen: true },  // Friday
    { dayOfWeek: 6, openTime: "09:30", closeTime: "18:30", isOpen: true },  // Saturday
];

export async function GET() {
    const prisma = await getPrisma();
    let schedules = await prisma.schedule.findMany({ orderBy: { dayOfWeek: "asc" } });

    // Seed defaults if none exist
    if (schedules.length === 0) {
        await prisma.schedule.createMany({ data: DEFAULT_SCHEDULE });
        schedules = await prisma.schedule.findMany({ orderBy: { dayOfWeek: "asc" } });
    }

    return NextResponse.json(schedules);
}

export async function PATCH(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const prisma = await getPrisma();
    const body = await req.json();
    // body: { dayOfWeek, openTime, closeTime, isOpen }
    const { dayOfWeek, openTime, closeTime, isOpen } = body;

    const schedule = await prisma.schedule.upsert({
        where: { dayOfWeek },
        update: { openTime, closeTime, isOpen },
        create: { dayOfWeek, openTime, closeTime, isOpen },
    });

    return NextResponse.json(schedule);
}
