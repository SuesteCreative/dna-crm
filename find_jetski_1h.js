const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const service = await prisma.service.findFirst({
        where: { variant: "1 hour" }
    });
    console.log(JSON.stringify(service, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
