const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    const partner = await prisma.partner.upsert({
        where: { email: 'info@experiencealgarve.com' }, // Assuming this email, if I don't know I'll use a placeholder
        update: {
            name: 'Experience Algarve',
            commission: 20, // Common default
        },
        create: {
            name: 'Experience Algarve',
            email: 'info@experiencealgarve.com',
            commission: 20,
        },
    });
    console.log("Partner Experience Algarve restored:", partner.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
