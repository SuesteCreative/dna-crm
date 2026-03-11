function timeToMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateSlots(openTime, closeTime, config) {
    const open = timeToMinutes(openTime);
    const close = timeToMinutes(closeTime);
    const { durationMinutes, slotGapMinutes } = config;
    const step = Math.max(1, durationMinutes + slotGapMinutes);
    const lastStart = close - durationMinutes;

    const slots = [];
    for (let t = open; t <= lastStart; t += step) {
        slots.push(minutesToTime(t));
    }
    return slots;
}

const slots = generateSlots("09:00", "18:30", {
    durationMinutes: 60,
    slotGapMinutes: -30
});
console.log(slots);
