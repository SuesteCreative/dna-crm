const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const services = await prisma.service.findMany();
    services.forEach(s => {
        console.log(`${s.name} (${s.variant}): duration=${s.durationMinutes}, gap=${s.slotGapMinutes}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
