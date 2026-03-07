import { google } from "googleapis";

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
        return res.data.id ?? null;
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
        return true;
    } catch (err: any) {
        if (err?.code === 404 || err?.code === 410) return true; // already deleted
        console.error(`gcal: failed to delete event ${eventId} on ${calendarId}:`, err);
        return false;
    }
}

// Builds start/end ISO strings from date "YYYY-MM-DD", time "HH:MM", duration in minutes
export function toGcalTimes(date: string, time: string, durationMinutes: number) {
    const start = new Date(`${date}T${time}:00`);
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
    dateStr: string // "YYYY-MM-DD"
): Promise<Map<string, { start: string; end: string }[]>> {
    const auth = getAuth();
    if (!auth || calendarIds.length === 0) return new Map();
    try {
        const calendar = google.calendar({ version: "v3", auth });
        const timeMin = new Date(`${dateStr}T00:00:00`).toISOString();
        const timeMax = new Date(`${dateStr}T23:59:59`).toISOString();
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
