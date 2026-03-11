const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    // 30-min jetski: currently gap 10 (40 min step). Let's set to 0 (30 min step).
    const u1 = await prisma.service.updateMany({
        where: { variant: "30 minutes", name: "Jetski Rental" },
        data: { slotGapMinutes: 0 }
    });

    // 20-min jetski: currently gap 10 (30 min step). Good.

    // 15-min jetski: currently gap 10 (25 min step). Set to 15 (30 min step)?
    // No, keep 15/20 min as they are or as requested.

    console.log(`Updated 30-min jetski: ${u1.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
