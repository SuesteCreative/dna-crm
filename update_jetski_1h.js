const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const updated = await prisma.service.updateMany({
        where: { variant: "1 hour", name: "Jetski Rental" },
        data: { slotGapMinutes: -30 }
    });
    console.log(`Updated ${updated.count} service(s).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
