import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

let prisma: PrismaClient | null = null;

export async function getPrisma() {
    if (prisma) return prisma;

    try {
        const { env } = await getCloudflareContext();
        const db = (env as any).DB;
        console.log("getPrisma debug - env.DB available:", !!db);

        if (db) {
            console.log("Initializing Prisma with D1 adapter");
            const adapter = new PrismaD1(db);
            prisma = new PrismaClient({ adapter } as any);
        } else {
            console.warn("D1 binding not found, using default client");
            prisma = new PrismaClient();
        }
    } catch (error) {
        console.warn("Error getting Cloudflare context, using default client:", error);
        prisma = new PrismaClient();
    }

    return prisma;
}
