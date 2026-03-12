const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const multi = await prisma.booking.findMany({
    where: { activities: { some: {} } },
    include: { activities: true }
  });
  
  const target = multi.filter(b => b.activities.length > 1);
  console.log(`Found ${target.length} multi-activity bookings.`);
  target.forEach(b => {
    console.log(`ID: ${b.id} | Created: ${b.createdAt} | Activities: ${b.activities.length}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
