import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, description, senderEmail } = await req.json();
    if (!subject || !description) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey === 'missing') {
        console.error("Resend API key missing");
        return NextResponse.json({ error: "Email configuration missing" }, { status: 500 });
    }

    try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
            from: "DNA CRM <onboarding@resend.dev>",
            to: "booking@desportosnauticosalvor.com",
            replyTo: senderEmail || undefined,
            subject: `[Bug Report] ${subject}`,
            text: `Submetido por: ${senderEmail || "desconhecido"}\n\n${description}`,
        });
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error("Bug report email failed:", err);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }
}
