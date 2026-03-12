const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const CALENDARS = {
  jetski1: "1d52190d35605a78c3c1ba2dd617b6447e1a87aca730958edbd1605c7a3815bf@group.calendar.google.com",
  jetski2: "e9100bf1ed3eec8761ded84c30d8473623f76eb2f3ce9e80f8e4ee6d8efd1ace@group.calendar.google.com",
  jetski3: "cedd504ce361cfee687650c79559c609c583f5f4bbf71c9bf41a89775b82c770@group.calendar.google.com",
  towable4: "24c00c9597fa5c6ed4a4ed28a38c1aaa3b25778a29fc06edae73f0d7fc6cecc9@group.calendar.google.com",
};

async function main() {
  console.log("Starting precise service and staff configuration...");

  // 1. Clear existing staff to start clean
  await prisma.gcalStaff.deleteMany({});

  const services = await prisma.service.findMany();

  // 2. Configure Services
  for (const s of services) {
    const fullText = (s.name + " " + (s.variant || "")).toLowerCase();
    let duration = s.durationMinutes;
    let gap = 10;
    let group = s.capacityGroup;
    let capacity = s.unitCapacity;

    if (fullText.includes("jetski")) {
      group = "JETSKI";
      capacity = 3;
      if (fullText.includes("1 hour")) {
        duration = 60;
        gap = -30; // To get 30-min start intervals (09:30, 10:00, 10:30)
      } else if (fullText.includes("30 minutes")) {
        duration = 30;
        gap = 0; // Starts at 09:30, 10:00, 10:30
      } else if (fullText.includes("20 minutes")) {
        duration = 20;
        gap = 10; // 20 + 10 = 30 min interval
      } else if (fullText.includes("15 minutes")) {
        duration = 15;
        gap = 0; // Interval 15
      } else if (fullText.includes("10 minutes")) {
        duration = 10;
        gap = 0; // Interval 10
      }
    } else if (fullText.includes("sofa") || fullText.includes("banana") || fullText.includes("slider") || fullText.includes("towable")) {
      group = "TOWABLE";
      capacity = 1;
      duration = 15;
      gap = 0; // Interval 15
    }

    await prisma.service.update({
      where: { id: s.id },
      data: {
        durationMinutes: duration,
        slotGapMinutes: gap,
        unitCapacity: capacity,
        capacityGroup: group,
        gcalEnabled: true,
      },
    });
    console.log(`Updated Service: ${s.name} [${s.variant}] -> Dur: ${duration}, Gap: ${gap}, Cap: ${capacity}`);

    // 3. Link Staff to this service
    if (group === "JETSKI") {
      await prisma.gcalStaff.createMany({
        data: [
          { name: "Jetski 1", calendarId: CALENDARS.jetski1, serviceId: s.id, order: 1 },
          { name: "Jetski 2", calendarId: CALENDARS.jetski2, serviceId: s.id, order: 2 },
          { name: "Jetski 3", calendarId: CALENDARS.jetski3, serviceId: s.id, order: 3 },
        ],
      });
    } else if (group === "TOWABLE") {
      await prisma.gcalStaff.create({
        data: { name: "Insufláveis 4", calendarId: CALENDARS.towable4, serviceId: s.id, order: 1 },
      });
    }
  }

  console.log("Configuration complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
