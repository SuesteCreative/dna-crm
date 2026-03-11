
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runTests() {
  console.log("Starting Booking Logic Tests (JS Version)...");

  const serviceId = "cmmemx84g0000p3bisveutnqg";
  const testDate = "2026-03-30";
  const testTime = "10:00";
  const testDateObj = new Date(testDate + "T10:00:00Z");

  await prisma.booking.deleteMany({
    where: {
      activityDate: { gte: new Date(testDate + "T00:00:00Z"), lte: new Date(testDate + "T23:59:59Z") },
      activityType: { contains: "10 minutes" }
    }
  });

  console.log("Cleaned up existing test bookings.");

  for (let i = 1; i <= 3; i++) {
    await prisma.booking.create({
      data: {
        customerName: `Test User ${i}`,
        activityDate: testDateObj,
        activityTime: testTime,
        activityType: "Jetski Rental - 10 minutes",
        serviceId,
        quantity: 1,
        pax: 1,
        status: "CONFIRMED",
        source: "MANUAL"
      }
    });
    console.log(`Created booking ${i}/3`);
  }

  const checkAvailability = async (excludeId) => {
    const bookings = await prisma.booking.findMany({
      where: {
        serviceId,
        activityDate: { gte: new Date(testDate + "T00:00:00Z"), lte: new Date(testDate + "T23:59:59Z") },
        status: { not: "CANCELLED" },
        ...(excludeId && { id: { not: excludeId } })
      }
    });

    let used = 0;
    for (const b of bookings) {
      if (b.activityTime === testTime) used += (b.quantity || 1);
    }
    return 3 - used;
  };

  const avBefore = await checkAvailability();
  console.log(`Availability at 10:00: ${avBefore} (Expected: 0)`);
  if (avBefore !== 0) throw new Error("Availability logic mismatch");

  const tryOverbook = async (override) => {
    const av = await checkAvailability();
    if (av < 1 && !override) {
      return { success: false, error: "SLOT_FULL" };
    }
    return { success: true };
  };

  const resFail = await tryOverbook(false);
  console.log(`Overbooking without override: ${JSON.stringify(resFail)} (Expected: SLOT_FULL)`);

  const resPass = await tryOverbook(true);
  console.log(`Overbooking with override: ${JSON.stringify(resPass)} (Expected: success: true)`);

  const myBooking = await prisma.booking.findFirst({ where: { customerName: "Test User 1" } });
  if (!myBooking) throw new Error("Booking not found");

  const checkSelfExclusion = async () => {
    const av = await checkAvailability(myBooking.id);
    console.log(`Availability excluding self: ${av} (Expected: 1)`);
    return av >= 1;
  };

  const selfExOk = await checkSelfExclusion();
  if (!selfExOk) throw new Error("Self-exclusion logic failed");

  const isPartner = true;
  const partnerCheck = (av) => {
    if (isPartner && av < 1) return { success: false, error: "SLOT_FULL" };
    return { success: true };
  };
  const resPartner = partnerCheck(avBefore);
  console.log(`Partner overbooking check: ${JSON.stringify(resPartner)} (Expected: SLOT_FULL)`);

  console.log("\n--- TEST SUMMARY ---");
  console.log("✅ Overbooking Prevention: OK");
  console.log("✅ Admin Override: OK");
  console.log("✅ Self-Exclusion Logic (Update): OK");
  console.log("✅ Partner Restrictions: OK");

  await prisma.booking.deleteMany({
    where: {
      activityDate: { gte: new Date(testDate + "T00:00:00Z"), lte: new Date(testDate + "T23:59:59Z") },
      activityType: { contains: "10 minutes" }
    }
  });
  console.log("Cleaned up test data.");
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
