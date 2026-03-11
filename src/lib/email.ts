import { Resend } from 'resend';
import QRCode from 'qrcode';
import { logAudit } from './audit';

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

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

        // Generate QR Code as Data URL for embedding in email
        const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });

        // Send Email
        const { data, error } = await resend.emails.send({
            from: 'Desportos Náuticos Alvor <onboarding@resend.dev>',
            to: booking.customerEmail,
            subject: `Reserva Confirmada - ${booking.customerName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e1e1e1; border-radius: 12px; color: #333;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #0056b3; margin-bottom: 10px;">Reserva Confirmada!</h1>
                        <p style="font-size: 18px; color: #555;">Olá ${booking.customerName}, aqui está o seu comprovativo.</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #0056b3;">
                        <h3 style="margin-top: 0; color: #0056b3;">Detalhes da Atividade</h3>
                        <p style="margin: 10px 0; line-height: 1.5;">
                            <strong>Atividade:</strong> ${booking.activityType || 'Reserva Esportiva'}<br>
                            <strong>Data:</strong> ${new Date(booking.activityDate).toLocaleDateString('pt-PT')}<br>
                            <strong>Hora:</strong> ${booking.activityTime || 'A confirmar'}<br>
                            <strong>Quantidade:</strong> ${booking.quantity || booking.pax} unidades/pax<br>
                            <strong>Preço Total:</strong> ${booking.totalPrice?.toFixed(2) || '0.00'}€
                        </p>
                    </div>

                    <div style="text-align: center; margin: 40px 0;">
                        <p style="font-weight: bold; font-size: 16px; margin-bottom: 20px;">Apresente este QR Code à chegada:</p>
                        <div style="display: inline-block; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: white;">
                            <img src="${qrDataUrl}" alt="QR Code para Check-in" style="width: 250px; height: 250px; display: block;" />
                        </div>
                        <p style="font-size: 12px; color: #999; margin-top: 15px;">ID da Reserva: ${booking.id}</p>
                    </div>

                    <div style="background-color: #fff4e5; padding: 20px; border-radius: 8px; border: 1px solid #ffe8cc; margin-top: 30px;">
                        <p style="margin: 0; font-size: 14px; color: #856404;">
                            <strong>Informação Importante:</strong> Recomendamos chegar 15 minutos antes da hora marcada.
                        </p>
                    </div>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
                    
                    <div style="text-align: center; color: #777; font-size: 14px;">
                        <p>© ${new Date().getFullYear()} Desportos Náuticos Alvor</p>
                        <p>Praia de Alvor, Portimão, Portugal</p>
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
                details: `Email sent to ${booking.customerEmail}`
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
