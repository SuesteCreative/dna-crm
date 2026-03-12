const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
    try {
        const count = await prisma.gcalStaff.count();
        console.log("GcalStaff count:", count);
        const staff = await prisma.gcalStaff.findMany();
        console.log("Staff IDs:", JSON.stringify(staff, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
