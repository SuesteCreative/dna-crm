const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const bookings = await prisma.booking.findMany({
    include: { activities: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("LAST_BOOKINGS_START");
  bookings.forEach(b => {
    console.log(`ID: ${b.id} | Activities: ${b.activities.length} | Date: ${b.activityDate}`);
    b.activities.forEach(a => {
        console.log(`  - ${a.activityType} @ ${a.activityTime}`);
    });
  });
  console.log("LAST_BOOKINGS_END");
}
main().catch(console.error).finally(() => prisma.$disconnect());
