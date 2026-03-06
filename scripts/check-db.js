const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const someBookings = await prisma.booking.findMany({
        where: { source: 'SHOPIFY' },
        select: { orderNumber: true, activityDate: true },
        orderBy: { activityDate: 'desc' },
        take: 5,
    });
    console.log(someBookings);
}

main().finally(() => prisma.$disconnect());
