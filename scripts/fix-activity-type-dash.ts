import { getPrisma } from "../src/lib/prisma";

async function main() {
    const prisma = await getPrisma();

    // Show all distinct activityType values
    const types = await prisma.booking.groupBy({
        by: ["activityType"],
        _count: { activityType: true },
        orderBy: { _count: { activityType: "desc" } },
    });

    console.log("Current activityType values:");
    types.forEach((t) =>
        console.log(` ${t._count.activityType}x  ${JSON.stringify(t.activityType)}`)
    );

    // Find ones with em dash (—) or en dash (–)
    const toFix = types.filter(
        (t) => t.activityType && (t.activityType.includes("—") || t.activityType.includes("–"))
    );

    if (toFix.length === 0) {
        console.log("\nNo em/en dashes found, nothing to fix.");
        process.exit(0);
    }

    console.log(`\nFixing ${toFix.length} activityType value(s)...`);

    for (const t of toFix) {
        const oldVal = t.activityType!;
        const newVal = oldVal.replace(/[—–]/g, "-");
        const result = await prisma.booking.updateMany({
            where: { activityType: oldVal },
            data: { activityType: newVal },
        });
        console.log(`  "${oldVal}" → "${newVal}" (${result.count} bookings)`);
    }

    console.log("\nDone.");
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
