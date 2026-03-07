export function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

export function minutesToTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface SlotInfo {
    time: string;       // "HH:MM"
    available: number;  // remaining capacity
    capacity: number;   // total capacity
    blocked: boolean;   // true if available === 0
}

export interface ServiceSlotConfig {
    durationMinutes: number;
    slotGapMinutes: number;
    unitCapacity: number;
    capacityGroup: string | null;
}

/**
 * Generate all possible slot start times for a service on a given day.
 * Last slot = closeTime - durationMinutes (last service must finish by close).
 */
export function generateSlots(
    openTime: string,
    closeTime: string,
    config: ServiceSlotConfig
): string[] {
    const open = timeToMinutes(openTime);
    const close = timeToMinutes(closeTime);
    const { durationMinutes, slotGapMinutes } = config;
    const step = durationMinutes + slotGapMinutes;
    const lastStart = close - durationMinutes;

    const slots: string[] = [];
    for (let t = open; t <= lastStart; t += step) {
        slots.push(minutesToTime(t));
    }
    return slots;
}

/**
 * Check if two time intervals overlap.
 * Each interval: [startMins, startMins + durationMins)
 */
export function timesOverlap(
    aStart: number,
    aDuration: number,
    bStart: number,
    bDuration: number
): boolean {
    return aStart < bStart + bDuration && aStart + aDuration > bStart;
}
