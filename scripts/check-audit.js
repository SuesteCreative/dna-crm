const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  console.log("AUDIT_LOGS:", JSON.stringify(logs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
