const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200
  });
  logs.forEach(l => {
    if (l.action === 'CREATE' || l.action === 'UPDATE') {
      console.log(`${l.createdAt} | ${l.action} | ${l.module} | ${l.targetName} | ${l.details}`);
    }
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
