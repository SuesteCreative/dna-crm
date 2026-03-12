import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    try {
        // Look for recent bookings (last 1 hour)
        const oneHourAgo = new Date(Date.now() - 3600000);
        const recent = await prisma.booking.findMany({
            where: { createdAt: { gte: oneHourAgo } },
            include: { activities: true }
        });
        console.log("Recent bookings:", JSON.stringify(recent, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
