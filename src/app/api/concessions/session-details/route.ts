import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Public endpoint — session_id is already an unguessable secret.
// Returns only what the success page needs; never exposes full Stripe session.
export async function GET(req: NextRequest) {
    const sessionId = new URL(req.url).searchParams.get("session_id");
    if (!sessionId) return NextResponse.json({ error: "session_id required" }, { status: 400 });

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        const m = session.metadata ?? {};

        return NextResponse.json({
            type: m.sessionType ?? "daily",
            name: m.clientName ?? "",
            period: m.period ?? "",
            date: m.date ?? "",
            startDate: m.startDate ?? "",
            endDate: m.endDate ?? "",
            days: m.days ?? "",
            freeDays: m.freeDays ?? "",
            total: m.grossAmount ?? (session.amount_total ? (session.amount_total / 100).toFixed(2) : ""),
        });
    } catch {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
}
