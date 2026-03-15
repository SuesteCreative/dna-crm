import { getPrisma } from "./prisma";
import { google } from "googleapis";

function getAuth() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) return null;
    try {
        const credentials = JSON.parse(raw);
        return new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
        });
    } catch {
        return null;
    }
}

export async function syncGcalToCache(calendarId: string, days: number = 365) {
    const auth = getAuth();
    if (!auth) return { success: false, error: "Auth failed" };

    const prisma = await getPrisma();
    const calendar = google.calendar({ version: "v3", auth });

    try {
        const now = new Date();
        const timeMin = now.toISOString();
        const timeMax = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

        const res = await calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: "startTime",
        });

        const events = res.data.items || [];

        // Delete existing cache for this calendar in the range
        // or just clear all future ones for simplicity during full sync
        await prisma.gcalBusySlot.deleteMany({
            where: {
                calendarId,
                startTime: { gte: now },
            },
        });

        // Insert new slots
        for (const event of events) {
            if (!event.start?.dateTime || !event.end?.dateTime) continue;

            await prisma.gcalBusySlot.upsert({
                where: { eventId: event.id! },
                update: {
                    startTime: new Date(event.start.dateTime),
                    endTime: new Date(event.end.dateTime),
                    summary: event.summary || null,
                    updatedAt: new Date(),
                },
                create: {
                    calendarId,
                    eventId: event.id!,
                    startTime: new Date(event.start.dateTime),
                    endTime: new Date(event.end.dateTime),
                    summary: event.summary || null,
                },
            });
        }

        return { success: true, count: events.length };
    } catch (error) {
        console.error(`Sync error for ${calendarId}:`, error);
        return { success: false, error: String(error) };
    }
}

export async function getCachedFreeBusy(calendarIds: string[], dateStr: string) {
    const prisma = await getPrisma();
    const startOfDay = new Date(`${dateStr}T00:00:00Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59Z`);

    const busySlots = await prisma.gcalBusySlot.findMany({
        where: {
            calendarId: { in: calendarIds },
            OR: [
                { startTime: { lte: endOfDay }, endTime: { gte: startOfDay } }
            ]
        }
    });

    const result = new Map<string, { start: string; end: string }[]>();
    for (const calId of calendarIds) {
        const slots = busySlots
            .filter((s: any) => s.calendarId === calId)
            .map((s: any) => ({
                start: s.startTime.toISOString(),
                end: s.endTime.toISOString()
            }));
        result.set(calId, slots);
    }
    return result;
}
