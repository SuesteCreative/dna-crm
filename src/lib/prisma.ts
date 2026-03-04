import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Creates a Prisma client using the D1 binding from the Cloudflare request context.
// Must be called inside a request handler.
export async function getPrisma() {
    try {
        const { env } = await getCloudflareContext();
        const adapter = new PrismaD1((env as any).DB);
        return new PrismaClient({ adapter } as any);
    } catch {
        // Fallback for local development (no Cloudflare context)
        return new PrismaClient();
    }
}
