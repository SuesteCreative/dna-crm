const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@desportosnauticosalvor.com';
    const adminPassword = 'adminpassword123'; // User should change this immediately

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Admin',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    console.log({ admin });
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
