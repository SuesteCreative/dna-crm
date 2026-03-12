const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration of bookings to activities...');
  
  const bookings = await prisma.booking.findMany({
    include: { activities: true }
  });
  
  console.log(`Found ${bookings.length} bookings.`);
  
  let createdCount = 0;
  let i = 0;
  for (const booking of bookings) {
    if (i < 5) console.log(`Booking ${booking.id} has ${booking.activities?.length} activities`);
    i++;
    if (!booking.activities || booking.activities.length === 0) {
      await prisma.bookingActivity.create({
        data: {
          bookingId: booking.id,
          serviceId: booking.serviceId,
          activityType: booking.activityType,
          activityDate: booking.activityDate,
          activityTime: booking.activityTime,
          pax: booking.pax,
          quantity: booking.quantity,
          totalPrice: booking.totalPrice,
          gcalCalendarIds: booking.gcalCalendarIds,
          gcalEventIds: booking.gcalEventIds,
        }
      });
      createdCount++;
    }
  }
  
  console.log(`Migration finished. Created ${createdCount} activity records.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
