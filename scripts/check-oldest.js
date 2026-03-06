const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const samples = await prisma.booking.findMany({
        where: { source: 'SHOPIFY' },
        select: { orderNumber: true, activityDate: true },
        orderBy: { activityDate: 'asc' }, // Smallest first
        take: 5,
    });
    console.log('Oldest samples:', samples);
}

main().finally(() => prisma.$disconnect());
