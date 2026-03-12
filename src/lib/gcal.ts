import { google } from "googleapis";
import { getPrisma } from "./prisma";
import { getCachedFreeBusy } from "./gcal-cache";

function getAuth() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) return null;
    try {
        const credentials = JSON.parse(raw);
        return new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/calendar"],
        });
    } catch {
        console.error("gcal: failed to parse GOOGLE_SERVICE_ACCOUNT_JSON");
        return null;
    }
}

// Returns the Google Calendar event ID, or null on failure
export async function createBusyEvent(
    calendarId: string,
    startISO: string,
    endISO: string,
    summary: string
): Promise<string | null> {
    const auth = getAuth();
    if (!auth) return null;
    try {
        const calendar = google.calendar({ version: "v3", auth });
        const res = await calendar.events.insert({
            calendarId,
            requestBody: {
                summary,
                start: { dateTime: startISO, timeZone: "Europe/Lisbon" },
                end: { dateTime: endISO, timeZone: "Europe/Lisbon" },
                status: "confirmed",
                transparency: "opaque", // marks as "busy"
            },
        });
        
        const eventId = res.data.id ?? null;
        if (eventId) {
            // Update local cache immediately
            const prisma = await getPrisma();
            await (prisma as any).gcalBusySlot.upsert({
                where: { eventId },
                update: {
                    calendarId,
                    startTime: new Date(startISO),
                    endTime: new Date(endISO),
                    summary,
                    updatedAt: new Date(),
                },
                create: {
                    calendarId,
                    eventId,
                    startTime: new Date(startISO),
                    endTime: new Date(endISO),
                    summary,
                }
            }).catch((e: any) => console.warn("Cache update failed in createBusyEvent:", e));
        }

        return eventId;
    } catch (err) {
        console.error(`gcal: failed to create event on ${calendarId}:`, err);
        return null;
    }
}

// Returns true if deleted successfully (or event not found), false on error
export async function deleteBusyEvent(
    calendarId: string,
    eventId: string
): Promise<boolean> {
    const auth = getAuth();
    if (!auth) return false;
    try {
        const calendar = google.calendar({ version: "v3", auth });
        await calendar.events.delete({ calendarId, eventId });
        
        // Remove from local cache immediately
        const prisma = await getPrisma();
        await (prisma as any).gcalBusySlot.delete({ where: { eventId } }).catch(() => {});

        return true;
    } catch (err: any) {
        if (err?.code === 404 || err?.code === 410) {
            const prisma = await getPrisma();
            await (prisma as any).gcalBusySlot.delete({ where: { eventId } }).catch(() => {});
            return true;
        }
        console.error(`gcal: failed to delete event ${eventId} on ${calendarId}:`, err);
        return false;
    }
}

// Builds start/end UTC ISO strings from date "YYYY-MM-DD", time "HH:MM" in Portugal local time
export function toGcalTimes(date: string, time: string, durationMinutes: number) {
    // Probe Portugal's UTC offset at noon on this date (handles DST automatically)
    const probe = new Date(`${date}T12:00:00Z`);
    const ptHour = Number(
        new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/Lisbon",
            hour: "2-digit",
            hour12: false,
        }).format(probe)
    );
    const offsetMinutes = (ptHour - 12) * 60; // minutes Portugal is ahead of UTC

    // Convert Portugal local slot time to UTC
    const [h, m] = time.split(":").map(Number);
    const baseMs = new Date(`${date}T00:00:00Z`).getTime();
    const start = new Date(baseMs + (h * 60 + m - offsetMinutes) * 60_000);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    return {
        startISO: start.toISOString(),
        endISO: end.toISOString(),
    };
}

// Returns a map of calendarId → busy periods for the given date
// Used to read Meety bookings (which appear as GCal events) into CRM slot availability
export async function getFreeBusy(
    calendarIds: string[],
    dateStr: string, // "YYYY-MM-DD"
    forceLive: boolean = false
): Promise<Map<string, { start: string; end: string }[]>> {
    if (!forceLive) {
        return await getCachedFreeBusy(calendarIds, dateStr);
    }

    const auth = getAuth();
    if (!auth || calendarIds.length === 0) return new Map();
    try {
        const calendar = google.calendar({ version: "v3", auth });
        const timeMin = new Date(`${dateStr}T00:00:00Z`).toISOString();
        const timeMax = new Date(`${dateStr}T23:59:59Z`).toISOString();
        const res = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                timeZone: "Europe/Lisbon",
                items: calendarIds.map(id => ({ id })),
            },
        });
        const result = new Map<string, { start: string; end: string }[]>();
        const cals = res.data.calendars ?? {};
        for (const calId of calendarIds) {
            result.set(calId, (cals[calId]?.busy ?? []) as { start: string; end: string }[]);
        }
        return result;
    } catch (err) {
        console.error("gcal freebusy error:", err);
        return new Map();
    }
}

// --- Push Notifications (Webhooks) ---

export async function watchCalendar(calendarId: string) {
    const auth = getAuth();
    if (!auth) return { success: false, error: "Auth failed" };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.CRM_URL;
    if (!baseUrl) return { success: false, error: "NEXT_PUBLIC_APP_URL not set" };

    const prisma = await getPrisma();
    const staff = await (prisma as any).gcalStaff.findFirst({ where: { calendarId } });
    if (!staff) return { success: false, error: "Staff not found" };

    const calendar = google.calendar({ version: "v3", auth });
    const channelId = `dna-watch-${staff.id}-${Date.now()}`;
    const webhookUrl = `${baseUrl}/api/gcal/webhook`;

    try {
        const res = await calendar.events.watch({
            calendarId,
            requestBody: {
                id: channelId,
                type: "web_hook",
                address: webhookUrl,
            },
        });

        // Update DB with watch info
        await (prisma as any).gcalStaff.update({
            where: { id: staff.id },
            data: {
                channelId: res.data.id,
                resourceId: res.data.resourceId,
                expiration: res.data.expiration ? BigInt(res.data.expiration) : null,
            },
        });

        return { success: true, channelId: res.data.id, expiration: res.data.expiration };
    } catch (err: any) {
        console.error(`gcal watch error for ${calendarId}:`, err);
        return { success: false, error: err.message };
    }
}

export async function stopWatch(staffId: string) {
    const auth = getAuth();
    if (!auth) return false;

    const prisma = await getPrisma();
    const staff = await (prisma as any).gcalStaff.findUnique({ where: { id: staffId } });
    if (!staff || !staff.channelId || !staff.resourceId) return false;

    try {
        const calendar = google.calendar({ version: "v3", auth });
        await calendar.channels.stop({
            requestBody: {
                id: staff.channelId,
                resourceId: staff.resourceId,
            },
        });
        await (prisma as any).gcalStaff.update({
            where: { id: staffId },
            data: { channelId: null, resourceId: null, expiration: null },
        });
        return true;
    } catch (err) {
        console.error("gcal stop watch error:", err);
        return false;
    }
}

export async function renewAllWatches() {
    const prisma = await getPrisma();
    const staff = await (prisma as any).gcalStaff.findMany();
    const results = [];
    for (const s of staff) {
        const res = await watchCalendar(s.calendarId);
        results.push({ name: s.name, ...res });
    }
    return results;
}
