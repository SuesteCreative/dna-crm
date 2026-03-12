const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("Reading all AuditLogs...");
    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${logs.length} logs.`);
    
    logs.forEach(log => {
        // Look for anything related to Partners or GcalStaff
        if (log.module === 'PARTNERS' || log.module === 'GCAL' || log.details.includes('Experience') || log.details.includes('calendar')) {
            console.log(`[${log.createdAt}] ${log.action} | ${log.module} | ${log.targetName} | ${log.details}`);
        }
    });

    // Also look for the most recent creation to see what happened to the user's "20 min and 30 min" booking
    const recentCreations = logs.filter(l => l.action === 'CREATE' && l.module === 'DASHBOARD').slice(-5);
    console.log("\nRecent creations in AuditLog:");
    recentCreations.forEach(l => {
        console.log(`[${l.createdAt}] ${l.targetName} | ${l.details}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
