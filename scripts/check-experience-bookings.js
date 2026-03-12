const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const search = 'Experience Algarve';
    const bookings = await prisma.booking.findMany({
        where: {
            OR: [
                { notes: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } },
                { activityType: { contains: search, mode: 'insensitive' } },
            ]
        }
    });

    console.log(`Found ${bookings.length} bookings matching "${search}"`);
    bookings.forEach(b => {
        console.log(`ID: ${b.id} | Customer: ${b.customerName} | Source: ${b.source} | Partner: ${b.partnerId}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
