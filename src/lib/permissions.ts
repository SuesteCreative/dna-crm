import { getPrisma } from "@/lib/prisma";

// Default/fallback permissions if none are found in the DB.
export const DEFAULT_PERMISSIONS = {
    SUPER_ADMIN: {
        dashboardAccess: true,
        dashboardCreate: true,
        dashboardOverride: true,
        concessionAccess: true,
        statisticsAccess: true,
        partnersAccess: true,
        adminAccess: true,
        shopifySync: true,
    },
    ADMIN: {
        dashboardAccess: true,
        dashboardCreate: true,
        dashboardOverride: true,
        concessionAccess: true,
        statisticsAccess: true,
        partnersAccess: true,
        adminAccess: true,
        shopifySync: true,
    },
    STAFF: {
        dashboardAccess: true,
        dashboardCreate: true,
        dashboardOverride: true,
        concessionAccess: true,
        statisticsAccess: false,
        partnersAccess: false,
        adminAccess: false,
        shopifySync: false,
    },
    PARTNER: {
        dashboardAccess: true,
        dashboardCreate: true,
        dashboardOverride: false,
        concessionAccess: false,
        statisticsAccess: true,
        partnersAccess: false,
        adminAccess: false,
        shopifySync: false,
    },
    USER: {
        dashboardAccess: false,
        dashboardCreate: false,
        dashboardOverride: false,
        concessionAccess: false,
        statisticsAccess: false,
        partnersAccess: false,
        adminAccess: false,
        shopifySync: false,
    }
};

export type RolePermissionType = typeof DEFAULT_PERMISSIONS.SUPER_ADMIN;

export async function getUserPermissions(role?: string): Promise<RolePermissionType> {
    const normalizedRole = role || "USER";

    // SUPER_ADMIN always has all permissions (overrides DB to prevent self-lockout)
    if (normalizedRole === "SUPER_ADMIN") {
        return DEFAULT_PERMISSIONS.SUPER_ADMIN;
    }

    if (!role) {
        return DEFAULT_PERMISSIONS.USER;
    }

    try {
        const prisma = await getPrisma();
        const dbPerms = await prisma.rolePermission.findUnique({
            where: { role: normalizedRole }
        });

        if (dbPerms) {
            return {
                dashboardAccess: dbPerms.dashboardAccess,
                dashboardCreate: dbPerms.dashboardCreate,
                dashboardOverride: dbPerms.dashboardOverride,
                concessionAccess: dbPerms.concessionAccess,
                statisticsAccess: dbPerms.statisticsAccess,
                partnersAccess: dbPerms.partnersAccess,
                adminAccess: dbPerms.adminAccess,
                shopifySync: dbPerms.shopifySync,
            };
        }
    } catch (e) {
        console.error("Failed to fetch permissions:", e);
    }

    // Fallback if not found in DB
    return DEFAULT_PERMISSIONS[normalizedRole as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.USER;
}
