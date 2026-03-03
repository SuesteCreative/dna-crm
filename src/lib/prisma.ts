import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

const prismaClientSingleton = () => {
    // Check if we are in a Cloudflare environment (process.env.DB is actually the binding)
    // For local development, we'll use standard Prisma
    if (process.env.DB) {
        const adapter = new PrismaD1(process.env.DB as any);
        // @ts-ignore - Prisma D1 adapter types are still experimental
        return new PrismaClient({ adapter });
    }
    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
