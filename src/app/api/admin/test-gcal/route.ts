import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";
import { createBusyEvent, toGcalTimes } from "@/lib/gcal";
import { google } from "googleapis";

export const dynamic = "force-dynamic";

export async function GET() {
    const { sessionClaims } = await auth();
    if ((sessionClaims as any)?.metadata?.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results: Record<string, any> = {};

    // 1. Check env var
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    results.envVarPresent = !!raw;
    if (!raw) return NextResponse.json({ ...results, error: "GOOGLE_SERVICE_ACCOUNT_JSON not set" });

    // 2. Parse JSON
    let credentials: any;
    try {
        credentials = JSON.parse(raw);
        results.serviceAccountEmail = credentials.client_email;
        results.projectId = credentials.project_id;
    } catch (e: any) {
        return NextResponse.json({ ...results, error: "JSON parse failed: " + e.message });
    }

    // 3. Load GcalStaff
    const prisma = await getPrisma();
    const staffRows = await (prisma as any).gcalStaff.findMany({ orderBy: { order: "asc" } });
    results.gcalStaffCount = staffRows.length;
    results.gcalStaff = staffRows.map((s: any) => ({
        name: s.name,
        calendarId: s.calendarId,
        capacityGroup: s.capacityGroup,
        order: s.order,
    }));

    if (staffRows.length === 0) {
        return NextResponse.json({ ...results, error: "No GcalStaff rows — run seed endpoint first" });
    }

    // 4. Try to list events (read-only check) on first calendar
    const firstCal = staffRows[0].calendarId;
    results.testCalendar = firstCal;
    try {
        const auth2 = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/calendar"],
        });
        const calendar = google.calendar({ version: "v3", auth: auth2 });
        const listRes = await calendar.events.list({
            calendarId: firstCal,
            maxResults: 1,
            timeMin: new Date().toISOString(),
        });
        results.calendarReadOk = true;
        results.calendarSummary = listRes.data.summary;
    } catch (e: any) {
        results.calendarReadOk = false;
        results.calendarReadError = e.message;
        return NextResponse.json({ ...results, error: "Cannot read calendar — check sharing permissions" });
    }

    // 5. Try creating a test event (will be deleted immediately)
    const now = new Date();
    const dateStr = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
    const { startISO, endISO } = toGcalTimes(dateStr, "23:00", 15);
    try {
        const eventId = await createBusyEvent(firstCal, startISO, endISO, "[TEST] DNA GCal check — delete me");
        results.createEventOk = !!eventId;
        results.createdEventId = eventId;

        // Delete the test event immediately
        if (eventId) {
            const auth2 = new google.auth.GoogleAuth({
                credentials,
                scopes: ["https://www.googleapis.com/auth/calendar"],
            });
            const calendar = google.calendar({ version: "v3", auth: auth2 });
            await calendar.events.delete({ calendarId: firstCal, eventId }).catch(() => {});
            results.testEventDeleted = true;
        }
    } catch (e: any) {
        results.createEventOk = false;
        results.createEventError = e.message;
    }

    // 6. Check recent bookings with gcal fields
    const recentActivities = await prisma.bookingActivity.findMany({
        where: { gcalEventIds: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, activityType: true, gcalEventIds: true, gcalCalendarIds: true, createdAt: true },
    });
    results.recentGcalActivities = recentActivities;

    return NextResponse.json(results);
}
