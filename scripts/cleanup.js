const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.booking.deleteMany({
        where: {
            OR: [
                { activityDate: { lt: new Date('2020-01-01') } },
                { activityDate: { gt: new Date('2030-01-01') } }
            ]
        }
    });
    console.log(`Deleted ${result.count} corrupted/zombie bookings.`);
}

main().finally(() => prisma.$disconnect());
