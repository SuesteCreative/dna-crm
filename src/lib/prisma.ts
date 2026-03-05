import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Creates a Prisma client using the D1 binding from the Cloudflare request context.
// Must be called inside a request handler.
export async function getPrisma() {
    try {
        const { env } = await getCloudflareContext();
        if ((env as any).DB) {
            console.log("Using Prisma with D1 adapter");
            const adapter = new PrismaD1((env as any).DB);
            return new PrismaClient({ adapter } as any);
        } else {
            console.warn("D1 binding 'DB' not found in Cloudflare context");
            throw new Error("Missing DB binding");
        }
    } catch (e) {
        console.warn("Prisma fallback triggered:", e);
        // Fallback for local development (no Cloudflare context)
        return new PrismaClient();
    }
}
