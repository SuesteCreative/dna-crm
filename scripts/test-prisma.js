const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.booking.count();
  console.log(`Total Bookings: ${count}`);
  const one = await prisma.booking.findFirst({ include: { activities: true } });
  console.log(`First Booking: ${one.id}`);
  console.log(`Activities defined: ${one.activities !== undefined}`);
  if (one.activities) {
    console.log(`Activities length: ${one.activities.length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
