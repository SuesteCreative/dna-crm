const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const recent = await prisma.booking.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 60 * 60000) } // last 1 hour
    },
    include: { activities: true }
  });
  
  recent.forEach(b => {
    console.log(`Booking ID: ${b.id}`);
    console.log(`Created: ${b.createdAt}`);
    console.log(`Customer: ${b.customerName}`);
    console.log(`Activities (${b.activities.length}):`);
    b.activities.forEach(a => {
      console.log(`  - ${a.activityType} @ ${a.activityTime} (${a.totalPrice}€)`);
    });
    console.log('---');
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
