import { getPrisma } from "../src/lib/prisma";

async function main() {
    const prisma = await getPrisma();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.booking.updateMany({
        where: {
            activityDate: { lt: today },
            showedUp: null,
        },
        data: { showedUp: true },
    });

    console.log(`Marked ${result.count} past bookings as showedUp=true`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
