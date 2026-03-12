const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bCount = await prisma.booking.count();
  const aCount = await prisma.bookingActivity.count();
  console.log(`Total Bookings: ${bCount}`);
  console.log(`Total Activities: ${aCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
