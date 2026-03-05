import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

let prisma: any = null;

export async function getPrisma() {
    if (prisma) return prisma;

    try {
        // Dynamic import to avoid module-level evaluation issues on some workers
        const { PrismaClient } = await import("@prisma/client/wasm");

        const { env } = await getCloudflareContext();
        const db = (env as any).DB;

        if (db) {
            console.log("Initializing Prisma with D1 adapter");
            const adapter = new PrismaD1(db);
            prisma = new PrismaClient({ adapter } as any);
        } else {
            console.warn("D1 binding not found, using default client");
            prisma = new PrismaClient();
        }
    } catch (error) {
        console.warn("Prisma init error:", error);
        // Fallback
        const { PrismaClient } = await import("@prisma/client/wasm");
        prisma = new PrismaClient();
    }

    return prisma;
}
