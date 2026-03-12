import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { DEFAULT_PERMISSIONS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const prisma = await getPrisma();
    const dbPerms = await prisma.rolePermission.findMany();

    // merge db perms with defaults just in case some roles haven't been saved yet
    const roles = ["STAFF", "ADMIN", "PARTNER"];
    const out = roles.map(r => {
        const existing = dbPerms.find((d: any) => d.role === r);
        if (existing) return existing;
        return {
            id: "virtual_" + r,
            role: r,
            ...DEFAULT_PERMISSIONS[r as keyof typeof DEFAULT_PERMISSIONS],
        };
    });

    return NextResponse.json(out);
}

export async function PUT(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    if (role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const prisma = await getPrisma();

    const { role: targetRole, ...permissions } = body;

    const upserted = await prisma.rolePermission.upsert({
        where: { role: targetRole },
        create: {
            role: targetRole,
            dashboardAccess: permissions.dashboardAccess,
            dashboardCreate: permissions.dashboardCreate,
            dashboardOverride: permissions.dashboardOverride,
            concessionAccess: permissions.concessionAccess,
            statisticsAccess: permissions.statisticsAccess,
            partnersAccess: permissions.partnersAccess,
            adminAccess: permissions.adminAccess,
            shopifySync: permissions.shopifySync,
        },
        update: {
            dashboardAccess: permissions.dashboardAccess,
            dashboardCreate: permissions.dashboardCreate,
            dashboardOverride: permissions.dashboardOverride,
            concessionAccess: permissions.concessionAccess,
            statisticsAccess: permissions.statisticsAccess,
            partnersAccess: permissions.partnersAccess,
            adminAccess: permissions.adminAccess,
            shopifySync: permissions.shopifySync,
        }
    });

    return NextResponse.json(upserted);
}
