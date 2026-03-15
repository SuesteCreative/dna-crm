import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const { sessionClaims } = await auth();
    if ((sessionClaims as any)?.metadata?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const checkDate = searchParams.get("date") || "2026-06-15"; // default to test date

    const results: Record<string, any> = {};

    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    results.envVarPresent = !!raw;
    if (!raw) return NextResponse.json({ ...results, error: "GOOGLE_SERVICE_ACCOUNT_JSON not set" });

    let credentials: any;
    try {
        credentials = JSON.parse(raw);
        results.serviceAccountEmail = credentials.client_email;
    } catch (e: any) {
        return NextResponse.json({ ...results, error: "JSON parse failed: " + e.message });
    }

    const prisma = await getPrisma();
    const staffRows = await (prisma as any).gcalStaff.findMany({ orderBy: { order: "asc" } });
    results.gcalStaffCount = staffRows.length;
    results.gcalStaff = staffRows.map((s: any) => ({ name: s.name, calendarId: s.calendarId, capacityGroup: s.capacityGroup }));

    if (staffRows.length === 0) {
        return NextResponse.json({ ...results, error: "No GcalStaff rows" });
    }

    // Check cache for checkDate
    const startOfDay = new Date(`${checkDate}T00:00:00Z`);
    const endOfDay = new Date(`${checkDate}T23:59:59Z`);
    const cachedSlots = await (prisma as any).gcalBusySlot.findMany({
        where: { startTime: { gte: startOfDay, lte: endOfDay } },
        orderBy: { startTime: "asc" },
    });
    results.cachedSlotsForDate = checkDate;
    results.cachedSlotCount = cachedSlots.length;
    results.cachedSlots = cachedSlots.map((s: any) => ({
        calendarId: s.calendarId.slice(0, 12) + "...",
        start: s.startTime,
        end: s.endTime,
        summary: s.summary,
    }));

    // Live check: list events from Google directly for checkDate
    const auth2 = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/calendar"] });
    const calendar = google.calendar({ version: "v3", auth: auth2 });
    results.liveEventsPerCalendar = [];
    for (const s of staffRows) {
        try {
            const res = await calendar.events.list({
                calendarId: s.calendarId,
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                singleEvents: true,
            });
            results.liveEventsPerCalendar.push({
                name: s.name,
                count: res.data.items?.length ?? 0,
                events: res.data.items?.map((e: any) => ({ summary: e.summary, start: e.start?.dateTime, end: e.end?.dateTime })),
            });
        } catch (e: any) {
            results.liveEventsPerCalendar.push({ name: s.name, error: e.message });
        }
    }

    // Total cache size
    results.totalCacheSize = await (prisma as any).gcalBusySlot.count();

    return NextResponse.json(results);
}
