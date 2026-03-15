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

// Auto-restore GcalStaff from GCAL_STAFF_CONFIG if the table is ever empty.
// Runs once per process — protects against accidental DB resets without manual recovery.
let gcalStaffChecked = false;

export async function getPrisma() {
    if (!gcalStaffChecked) {
        gcalStaffChecked = true;
        try {
            const count = await (prisma as any).gcalStaff.count();
            if (count === 0) {
                const raw = process.env.GCAL_STAFF_CONFIG;
                if (raw) {
                    const entries: { name: string; calendarId: string; capacityGroup?: string; order: number }[] = JSON.parse(raw);
                    await (prisma as any).gcalStaff.createMany({
                        data: entries.map(e => ({
                            name: e.name,
                            calendarId: e.calendarId,
                            capacityGroup: e.capacityGroup || null,
                            order: e.order,
                        })),
                    });
                    console.log(`[prisma] Auto-restored ${entries.length} GcalStaff rows from GCAL_STAFF_CONFIG`);
                }
            }
        } catch (e) {
            // Non-fatal — app continues even if auto-seed fails
            console.warn("[prisma] GcalStaff auto-seed failed:", e);
        }
    }
    return prisma;
}
