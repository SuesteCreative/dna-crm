import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    include: { activities: true }
  });

  console.log(`Processing ${bookings.length} bookings...`);
  let created = 0;

  for (const b of bookings) {
    if (b.activities.length === 0) {
      await prisma.bookingActivity.create({
        data: {
          bookingId: b.id,
          serviceId: b.serviceId,
          activityType: b.activityType || "Atividade",
          activityDate: b.activityDate,
          activityTime: b.activityTime,
          pax: b.pax,
          quantity: b.quantity || 1,
          totalPrice: b.totalPrice
        }
      });
      created++;
    }
  }

  console.log(`Created ${created} activities.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
