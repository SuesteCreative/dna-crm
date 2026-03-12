import { Resend } from 'resend';
import QRCode from 'qrcode';
import { logAudit } from './audit';
import { getPrisma } from './prisma';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || process.env.NEXTAUTH_URL
    || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null)
    || 'https://desportosnauticosalvor.com';
// Updated design version: 2026-03-11 08:45

export async function sendBookingQRCode(booking: any) {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey || resendApiKey === 'missing') {
        const msg = "RESEND_API_KEY is missing. Cannot send QR code email.";
        console.error(msg);
        await logAudit({
            userId: "system",
            action: "EMAIL_ERROR",
            module: "BOOKING",
            targetId: booking.id,
            details: msg
        });
        return;
    }

    if (!booking.customerEmail) {
        console.log(`No email for booking ${booking.id}, skipping QR code email.`);
        return;
    }

    try {
        const resend = new Resend(resendApiKey);
        const checkInUrl = `${baseUrl}/check-in/${booking.id}`;

        // Create QR code as buffer for attachment
        // Many email clients (like Gmail) block data-uri images in the src attribute.
        // We will use CID (Content-ID) instead.
        const qrBuffer = await QRCode.toBuffer(checkInUrl, {
            width: 500,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });

        // Logo URL (must be public)
        const logoUrl = `${baseUrl}/SVG/logo-color.png`;

        // Send Email
        const { data, error } = await resend.emails.send({
            from: 'Desportos Náuticos Alvor <booking@desportosnauticosalvor.com>',
            to: booking.customerEmail,
            subject: `Reserva Confirmada - ${booking.customerName}`,
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: qrBuffer,
                    contentType: 'image/png',
                    contentId: 'qrcode_cid'
                }
            ],
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #fcfcfc; border: 1px solid #eee; border-radius: 16px;">
                    <!-- Logo Header -->
                    <div style="text-align: center; margin-bottom: 25px; padding-top: 10px;">
                        <img src="${logoUrl}" alt="DNA Logo" style="width: 120px; display: inline-block;" />
                    </div>

                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0056b3; margin-bottom: 5px; font-size: 26px;">Reserva Confirmada!</h1>
                        <p style="font-size: 16px; color: #666; margin-top: 0;">Olá <strong>${booking.customerName}</strong>, aqui está o seu comprovativo.</p>
                    </div>
                    
                    <!-- Activity Details -->
                    <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #f0f0f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border-left: 5px solid #0056b3;">
                        <h3 style="margin-top: 0; color: #0056b3; font-size: 18px; text-transform: uppercase; letter-spacing: 0.05em;">Detalhes da Reserva</h3>
                        <div style="margin: 15px 0; line-height: 1.6; font-size: 15px;">
                            <div style="margin-bottom: 8px;"><strong>Atividade:</strong> <span style="color: #555;">${booking.activityType || 'Sports Booking'}</span></div>
                            <div style="margin-bottom: 8px;"><strong>Data:</strong> <span style="color: #555;">${new Date(booking.activityDate).toLocaleDateString('pt-PT')}</span></div>
                            <div style="margin-bottom: 8px;"><strong>Hora:</strong> <span style="color: #555;">${booking.activityTime || 'A confirmar'}</span></div>
                            <div style="margin-bottom: 8px;"><strong>Quantidade:</strong> <span style="color: #555;">${booking.quantity || booking.pax} unidades/pax</span></div>
                            
                            ${(booking.bookingFee > 0) ? `
                                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eeeeee;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #666;">
                                        <span>Total da Atividade:</span>
                                        <span>${((booking.totalPrice || 0) + (booking.bookingFee || 0)).toFixed(2)}€</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #10b981;">
                                        <span>Valor Pago (Sinal):</span>
                                        <span>-${(booking.bookingFee || 0).toFixed(2)}€</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 18px; color: #0056b3;">
                                        <strong>Total na Praia:</strong>
                                        <strong>${(booking.totalPrice || 0).toFixed(2)}€</strong>
                                    </div>
                                </div>
                            ` : `
                                <div style="margin-top: 12px; font-size: 18px; color: #0056b3;"><strong>Preço Total:</strong> ${booking.totalPrice?.toFixed(2) || '0.00'}€</div>
                                <div style="font-size: 12px; color: #999; margin-top: 4px;">Valor total a liquidar à chegada.</div>
                            `}
                            
                            <div style="margin-top: 15px; font-size: 12px; color: #888;">
                                <strong>Origem:</strong> ${(booking.source === "PARTNER" && booking.partner?.name) ? booking.partner.name : booking.source}
                            </div>
                        </div>
                    </div>

                    <!-- QR Code Section -->
                    <div style="text-align: center; margin: 40px 0; background-color: #fff; padding: 30px; border-radius: 12px; border: 1px dashed #ddd;">
                        <p style="font-weight: bold; font-size: 15px; margin-bottom: 20px; color: #555;">Apresente este QR Code à chegada:</p>
                        <div style="display: inline-block; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
                            <img src="cid:qrcode_cid" alt="QR Code para Check-in" style="width: 250px; height: 250px; display: block;" />
                        </div>
                        <p style="font-size: 11px; color: #999; margin-top: 15px; font-family: monospace;">ID: ${booking.id}</p>
                    </div>

                    <!-- Important Info -->
                    <div style="background-color: #fff8eb; padding: 15px 20px; border-radius: 10px; border-left: 4px solid #f59e0b; margin-top: 20px;">
                        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.4;">
                            <strong>Informação Importante:</strong> Recomendamos chegar 15 minutos antes da hora marcada para o briefing técnico.
                        </p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
                    
                    <!-- Footer -->
                    <div style="text-align: center; color: #888; font-size: 13px; line-height: 1.6;">
                        <p style="font-weight: 600; color: #555; margin-bottom: 4px;">Desportos Náuticos Alvor</p>
                        <p style="margin: 0;">Praia dos Três Irmãos, Alvor, Algarve</p>
                        <p style="margin: 5px 0 0 0; color: #7c3aed; font-size: 12px;">Pesquise por "Desportos Náuticos Alvor - Watersports" no Google Maps.</p>
                        <p style="margin-top: 20px;">© ${new Date().getFullYear()} Sueste Creative - CRM System</p>
                    </div>
                </div>
            `,
        });

        if (error) {
            const errorMsg = `Resend error for booking ${booking.id}: ${JSON.stringify(error)}`;
            console.error(errorMsg);
            await logAudit({
                userId: "system",
                action: "EMAIL_ERROR",
                module: "BOOKING",
                targetId: booking.id,
                details: errorMsg
            });
        } else {
            console.log(`QR code email sent successfully to ${booking.customerEmail} for booking ${booking.id}`);
            await logAudit({
                userId: "system",
                action: "EMAIL_SENT",
                module: "BOOKING",
                targetId: booking.id,
                targetName: booking.customerName,
                details: `Email sent to ${booking.customerEmail} via Resend ID ${data?.id}`
            });
        }
    } catch (err: any) {
        const catchMsg = `Failed to generate/send QR code for booking ${booking.id}: ${err.message}`;
        console.error(catchMsg);
        await logAudit({
            userId: "system",
            action: "EMAIL_ERROR",
            module: "BOOKING",
            targetId: booking.id,
            details: catchMsg
        });
    }
}

export async function sendFollowUpEmail(booking: any) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey || resendApiKey === 'missing' || !booking.customerEmail) return;

    try {
        const resend = new Resend(resendApiKey);
        const logoUrl = `${baseUrl}/SVG/logo-color.png`;
        const reviewUrl = "https://g.page/r/CU6X1u2zW_YGEAE/review"; // Placeholder or extracted

        const { error } = await resend.emails.send({
            from: 'Desportos Náuticos Alvor <nauticos@desportosnauticosalvor.com>',
            to: booking.customerEmail,
            subject: `Obrigado pela sua visita, ${booking.customerName.split(' ')[0]}!`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #fcfcfc; border: 1px solid #eee; border-radius: 16px;">
                    <div style="text-align: center; margin-bottom: 25px; padding-top: 10px;">
                        <img src="${logoUrl}" alt="DNA Logo" style="width: 120px; display: inline-block;" />
                    </div>

                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0056b3; margin-bottom: 5px; font-size: 26px;">Esperamos que se tenha divertido!</h1>
                        <p style="font-size: 16px; color: #666; margin-top: 0;">Olá ${booking.customerName.split(' ')[0]}, foi um prazer receber-vos ontem.</p>
                    </div>
                    
                    <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #f0f0f0; text-align: center;">
                        <p style="font-size: 15px; line-height: 1.6; color: #555;">
                            A sua opinião é muito importante para nós. Se gostou da experiência com <strong>${booking.activityType || 'as nossas atividades'}</strong>, poderia dedicar um minuto a deixar-nos um comentário?
                        </p>
                        
                        <a href="${reviewUrl}" style="display: inline-block; background-color: #0056b3; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; font-size: 16px;">
                            Deixar Avaliação no Google
                        </a>
                    </div>

                    <div style="text-align: center; margin-top: 30px; font-size: 14px; color: #888;">
                        <p>Até à próxima aventura!</p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
                    
                    <div style="text-align: center; color: #888; font-size: 13px;">
                        <p style="font-weight: 600; color: #555;">Desportos Náuticos Alvor</p>
                        <p>© ${new Date().getFullYear()} Sueste Creative - CRM System</p>
                    </div>
                </div>
            `,
        });

        if (!error) {
            const prisma = await getPrisma();
            await (prisma as any).booking.update({
                where: { id: booking.id },
                data: { followUpSent: true },
            });
        }
    } catch (err) {
        console.error("Follow-up email failed:", err);
    }
}
