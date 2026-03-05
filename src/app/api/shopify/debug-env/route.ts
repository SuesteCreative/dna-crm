import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const { env } = await getCloudflareContext({ async: true });
        return NextResponse.json({
            bindings: Object.keys(env as any),
            hasDB: !!(env as any).DB,
            hasDnaCrmDb: !!(env as any).dna_crm_db,
            nodeVersion: process.version,
            envKeys: Object.keys(process.env)
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
