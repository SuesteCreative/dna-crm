import { Resend } from 'resend';
import QRCode from 'qrcode';
import { logAudit } from './audit';
import { getPrisma } from './prisma';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || process.env.NEXTAUTH_URL
    || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null)
    || 'https://desportosnauticosalvor.com';
// Updated design version: 2026-03-11 08:45

// ── Language detection ────────────────────────────────────────────────────────

type Lang = "pt" | "en" | "es" | "fr" | "de";

const SPANISH_COUNTRIES = new Set([
  "ES", "MX", "AR", "CO", "PE", "VE", "CL", "EC", "GT", "CU", "BO", "DO",
  "HN", "PY", "SV", "NI", "CR", "PA", "UY", "GQ",
]);

const FRENCH_COUNTRIES = new Set([
  "FR", "MC", "BE", "LU", "CH", "DZ", "MA", "TN", "SN", "CI", "CM", "CD",
  "CG", "MG", "BF", "GN", "BJ", "NE", "TG", "RW", "MR", "CF", "TD", "GA",
  "DJ", "KM", "SC", "HT", "MU", "VU", "PF", "NC",
]);

const GERMAN_COUNTRIES = new Set(["DE", "AT", "LI"]);

function getEmailLang(country?: string | null): Lang {
  if (!country || country === "Other") return "en";
  if (country === "PT") return "pt";
  if (SPANISH_COUNTRIES.has(country)) return "es";
  if (FRENCH_COUNTRIES.has(country)) return "fr";
  if (GERMAN_COUNTRIES.has(country)) return "de";
  return "en";
}

// ── Translations ──────────────────────────────────────────────────────────────

interface EmailStrings {
  subject: (name: string) => string;
  headline: string;
  greeting: (name: string) => string;
  detailsTitle: string;
  activity: string;
  date: string;
  time: string;
  quantity: string;
  toConfirm: string;
  unitsPax: string;
  activityTotal: string;
  depositPaid: string;
  beachBalance: string;
  totalPrice: string;
  payAtArrival: string;
  source: string;
  qrInstruction: string;
  important: string;
  briefing: string;
  dateLocale: string;
}

const T: Record<Lang, EmailStrings> = {
  pt: {
    subject: (n) => `Reserva Confirmada - ${n}`,
    headline: "Reserva Confirmada!",
    greeting: (n) => `Olá <strong>${n}</strong>, aqui está o seu comprovativo.`,
    detailsTitle: "Detalhes da Reserva",
    activity: "Atividade",
    date: "Data",
    time: "Hora",
    quantity: "Quantidade",
    toConfirm: "A confirmar",
    unitsPax: "unidades/pax",
    activityTotal: "Total da Atividade",
    depositPaid: "Valor Pago (Sinal)",
    beachBalance: "Total na Praia",
    totalPrice: "Preço Total",
    payAtArrival: "Valor total a liquidar à chegada.",
    source: "Origem",
    qrInstruction: "Apresente este QR Code à chegada:",
    important: "Informação Importante:",
    briefing: "Recomendamos chegar 15 minutos antes da hora marcada para o briefing técnico.",
    dateLocale: "pt-PT",
  },
  en: {
    subject: (n) => `Booking Confirmed - ${n}`,
    headline: "Booking Confirmed!",
    greeting: (n) => `Hello <strong>${n}</strong>, here is your booking confirmation.`,
    detailsTitle: "Booking Details",
    activity: "Activity",
    date: "Date",
    time: "Time",
    quantity: "Quantity",
    toConfirm: "To be confirmed",
    unitsPax: "units/pax",
    activityTotal: "Activity Total",
    depositPaid: "Amount Paid (Deposit)",
    beachBalance: "Balance Due on Site",
    totalPrice: "Total Price",
    payAtArrival: "Total amount due upon arrival.",
    source: "Source",
    qrInstruction: "Present this QR Code upon arrival:",
    important: "Important Information:",
    briefing: "We recommend arriving 15 minutes before your scheduled time for the technical briefing.",
    dateLocale: "en-GB",
  },
  es: {
    subject: (n) => `Reserva Confirmada - ${n}`,
    headline: "¡Reserva Confirmada!",
    greeting: (n) => `Hola <strong>${n}</strong>, aquí está su confirmación de reserva.`,
    detailsTitle: "Detalles de la Reserva",
    activity: "Actividad",
    date: "Fecha",
    time: "Hora",
    quantity: "Cantidad",
    toConfirm: "Por confirmar",
    unitsPax: "unidades/pax",
    activityTotal: "Total de la Actividad",
    depositPaid: "Importe Pagado (Señal)",
    beachBalance: "Saldo a Pagar en el Lugar",
    totalPrice: "Precio Total",
    payAtArrival: "Importe total a abonar a su llegada.",
    source: "Origen",
    qrInstruction: "Presente este código QR a su llegada:",
    important: "Información Importante:",
    briefing: "Recomendamos llegar 15 minutos antes de la hora acordada para el briefing técnico.",
    dateLocale: "es-ES",
  },
  fr: {
    subject: (n) => `Réservation Confirmée - ${n}`,
    headline: "Réservation Confirmée !",
    greeting: (n) => `Bonjour <strong>${n}</strong>, voici votre confirmation de réservation.`,
    detailsTitle: "Détails de la Réservation",
    activity: "Activité",
    date: "Date",
    time: "Heure",
    quantity: "Quantité",
    toConfirm: "À confirmer",
    unitsPax: "unités/pax",
    activityTotal: "Total de l'Activité",
    depositPaid: "Montant Payé (Acompte)",
    beachBalance: "Solde Dû sur Place",
    totalPrice: "Prix Total",
    payAtArrival: "Montant total à régler à l'arrivée.",
    source: "Source",
    qrInstruction: "Présentez ce QR Code à votre arrivée :",
    important: "Information Importante :",
    briefing: "Nous vous recommandons d'arriver 15 minutes avant l'heure prévue pour le briefing technique.",
    dateLocale: "fr-FR",
  },
  de: {
    subject: (n) => `Buchung Bestätigt - ${n}`,
    headline: "Buchung Bestätigt!",
    greeting: (n) => `Hallo <strong>${n}</strong>, hier ist Ihre Buchungsbestätigung.`,
    detailsTitle: "Buchungsdetails",
    activity: "Aktivität",
    date: "Datum",
    time: "Uhrzeit",
    quantity: "Menge",
    toConfirm: "Noch zu bestätigen",
    unitsPax: "Einheiten/Personen",
    activityTotal: "Aktivität Gesamt",
    depositPaid: "Bezahlter Betrag (Anzahlung)",
    beachBalance: "Restbetrag vor Ort",
    totalPrice: "Gesamtpreis",
    payAtArrival: "Gesamtbetrag bei Ankunft zu zahlen.",
    source: "Quelle",
    qrInstruction: "Zeigen Sie diesen QR-Code bei der Ankunft vor:",
    important: "Wichtige Information:",
    briefing: "Wir empfehlen, 15 Minuten vor der geplanten Zeit für das technische Briefing zu erscheinen.",
    dateLocale: "de-DE",
  },
};

// ── QR booking email ──────────────────────────────────────────────────────────

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

        const qrBuffer = await QRCode.toBuffer(checkInUrl, {
            width: 500,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
        });

        const logoUrl = `${baseUrl}/SVG/logo-color.png`;

        const lang = getEmailLang(booking.country);
        const s = T[lang];
        const formattedDate = new Date(booking.activityDate).toLocaleDateString(s.dateLocale);
        const hasBookingFee = booking.bookingFee > 0;

        const { data, error } = await resend.emails.send({
            from: 'Desportos Náuticos Alvor <booking@desportosnauticosalvor.com>',
            to: booking.customerEmail,
            subject: s.subject(booking.customerName),
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
                        <h1 style="color: #0056b3; margin-bottom: 5px; font-size: 26px;">${s.headline}</h1>
                        <p style="font-size: 16px; color: #666; margin-top: 0;">${s.greeting(booking.customerName)}</p>
                    </div>

                    <!-- Activity Details -->
                    <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #f0f0f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border-left: 5px solid #0056b3;">
                        <h3 style="margin-top: 0; color: #0056b3; font-size: 18px; text-transform: uppercase; letter-spacing: 0.05em;">${s.detailsTitle}</h3>
                        <div style="margin: 15px 0; line-height: 1.6; font-size: 15px;">
                            <div style="margin-bottom: 8px;"><strong>${s.activity}:</strong> <span style="color: #555;">${booking.activityType || 'Sports Booking'}</span></div>
                            <div style="margin-bottom: 8px;"><strong>${s.date}:</strong> <span style="color: #555;">${formattedDate}</span></div>
                            <div style="margin-bottom: 8px;"><strong>${s.time}:</strong> <span style="color: #555;">${booking.activityTime || s.toConfirm}</span></div>
                            <div style="margin-bottom: 8px;"><strong>${s.quantity}:</strong> <span style="color: #555;">${booking.quantity || booking.pax} ${s.unitsPax}</span></div>

                            ${hasBookingFee ? `
                                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eeeeee;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #666;">
                                        <span>${s.activityTotal}:</span>
                                        <span>${((booking.totalPrice || 0) + (booking.bookingFee || 0)).toFixed(2)}€</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #10b981;">
                                        <span>${s.depositPaid}:</span>
                                        <span>-${(booking.bookingFee || 0).toFixed(2)}€</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 18px; color: #0056b3;">
                                        <strong>${s.beachBalance}:</strong>
                                        <strong>${(booking.totalPrice || 0).toFixed(2)}€</strong>
                                    </div>
                                </div>
                            ` : `
                                <div style="margin-top: 12px; font-size: 18px; color: #0056b3;"><strong>${s.totalPrice}:</strong> ${booking.totalPrice?.toFixed(2) || '0.00'}€</div>
                                <div style="font-size: 12px; color: #999; margin-top: 4px;">${s.payAtArrival}</div>
                            `}

                            <div style="margin-top: 15px; font-size: 12px; color: #888;">
                                <strong>${s.source}:</strong> ${(booking.source === "PARTNER" && booking.partner?.name) ? booking.partner.name : booking.source}
                            </div>
                        </div>
                    </div>

                    <!-- QR Code Section -->
                    <div style="text-align: center; margin: 40px 0; background-color: #fff; padding: 30px; border-radius: 12px; border: 1px dashed #ddd;">
                        <p style="font-weight: bold; font-size: 15px; margin-bottom: 20px; color: #555;">${s.qrInstruction}</p>
                        <div style="display: inline-block; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
                            <img src="cid:qrcode_cid" alt="QR Code" style="width: 250px; height: 250px; display: block;" />
                        </div>
                        <p style="font-size: 11px; color: #999; margin-top: 15px; font-family: monospace;">ID: ${booking.id}</p>
                    </div>

                    <!-- Important Info -->
                    <div style="background-color: #fff8eb; padding: 15px 20px; border-radius: 10px; border-left: 4px solid #f59e0b; margin-top: 20px;">
                        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.4;">
                            <strong>${s.important}</strong> ${s.briefing}
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
            console.log(`QR code email sent (lang=${lang}) to ${booking.customerEmail} for booking ${booking.id}`);
            await logAudit({
                userId: "system",
                action: "EMAIL_SENT",
                module: "BOOKING",
                targetId: booking.id,
                targetName: booking.customerName,
                details: `Email sent to ${booking.customerEmail} via Resend ID ${data?.id} (lang=${lang})`
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
