const { generateSlots } = require("./src/lib/slots");

const slots = generateSlots("09:00", "18:30", {
    durationMinutes: 60,
    slotGapMinutes: -30
});
console.log(slots);
