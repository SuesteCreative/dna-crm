import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
    const client = new PrismaClient();

    // Safety guard: prevent hard-deletes on critical business data.
    // Use soft-delete (deletedAt) instead.
    client.$use(async (params, next) => {
        const protectedModels = ["Booking", "Customer"];
        if (
            protectedModels.includes(params.model ?? "") &&
            (params.action === "delete" || params.action === "deleteMany")
        ) {
            throw new Error(
                `Hard delete on ${params.model} is blocked. Use soft-delete: update({ data: { deletedAt: new Date() } })`
            );
        }
        return next(params);
    });

    return client;
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function getPrisma() {
    return prisma;
}
