import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.gcalStaff.count();
    console.log("GcalStaff count:", count);
}
main();
