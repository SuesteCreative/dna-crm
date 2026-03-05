import { PrismaClient } from "@prisma/client/wasm";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Hack to prevent Prisma from crashing on unsupported fs.readdir in some polyfilled environments
if (typeof (globalThis as any).process === "undefined") {
    (globalThis as any).process = { env: {} };
}
if (!(globalThis as any).fs) {
    (globalThis as any).fs = { readdir: (p: any, cb: any) => cb(null, []), readdirSync: () => [] };
}

// Creates a Prisma client using the D1 binding from the Cloudflare request context.
// Must be called inside a request handler.
export async function getPrisma() {
    try {
        const { env } = await getCloudflareContext();
        console.log("Cloudflare env keys:", Object.keys(env || {}));

        const db = (env as any).DB;
        if (db) {
            console.log("Using Prisma with D1 adapter (DB found)");
            const adapter = new PrismaD1(db);
            return new PrismaClient({ adapter } as any);
        } else {
            console.warn("D1 binding 'DB' NOT found in Cloudflare context");
            throw new Error("Missing DB binding");
        }
    } catch (e) {
        console.warn("Prisma initialization error/fallback:", e);
        // Fallback for local development
        return new PrismaClient();
    }
}
