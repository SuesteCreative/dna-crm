import { getPrisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export async function logAudit({
    userId,
    userName,
    action,
    module,
    targetId,
    targetName,
    details,
}: {
    userId: string;
    userName?: string;
    action: string;
    module: string;
    targetId?: string;
    targetName?: string;
    details?: Record<string, any> | string;
}) {
    try {
        let finalUserName = userName;
        if (!finalUserName && userId !== "system") {
            try {
                const clerk = await clerkClient();
                const user = await clerk.users.getUser(userId);
                finalUserName = user.fullName || user.username || user.primaryEmailAddress?.emailAddress || "Unknown";
            } catch (err) {
                finalUserName = "Unknown (Clerk Error)";
            }
        }

        const prisma = await getPrisma();
        await prisma.auditLog.create({
            data: {
                userId,
                userName: finalUserName || "System",
                action,
                module,
                targetId,
                targetName,
                details: typeof details === "string" ? details : details ? JSON.stringify(details) : null,
            },
        });
    } catch (error) {
        console.error("Audit log failed:", error);
    }
}
