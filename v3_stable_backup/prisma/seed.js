const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'booking@desportosnauticosalvor.com';
    const adminPassword = 'adminpassword123'; // User should change this immediately

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            id: 'admin_seed',
            email: adminEmail,
            name: 'Admin',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    const systemUser = await prisma.user.upsert({
        where: { id: 'system' },
        update: {},
        create: {
            id: 'system',
            email: 'system@internal.dna',
            name: 'System',
            role: 'ADMIN',
        },
    });

    console.log({ admin, systemUser });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
