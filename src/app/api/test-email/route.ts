import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import QRCode from "qrcode";

// TEMPORARY — delete after testing

const baseUrl = "https://app.desportosnauticosalvor.com";

type Lang = "pt" | "en" | "es" | "fr" | "de";

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

function buildHtml(lang: Lang, booking: any): string {
  const s = T[lang];
  const logoUrl = `${baseUrl}/SVG/logo-color.png`;
  const formattedDate = new Date(booking.activityDate).toLocaleDateString(s.dateLocale);
  const hasBookingFee = booking.bookingFee > 0;
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; background-color: #fcfcfc; border: 1px solid #eee; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 25px; padding-top: 10px;">
        <img src="${logoUrl}" alt="DNA Logo" style="width: 120px; display: inline-block;" />
      </div>
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0056b3; margin-bottom: 5px; font-size: 26px;">${s.headline}</h1>
        <p style="font-size: 16px; color: #666; margin-top: 0;">${s.greeting(booking.customerName)}</p>
      </div>
      <div style="background-color: #ffffff; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #f0f0f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border-left: 5px solid #0056b3;">
        <h3 style="margin-top: 0; color: #0056b3; font-size: 18px; text-transform: uppercase; letter-spacing: 0.05em;">${s.detailsTitle}</h3>
        <div style="margin: 15px 0; line-height: 1.6; font-size: 15px;">
          <div style="margin-bottom: 8px;"><strong>${s.activity}:</strong> <span style="color: #555;">${booking.activityType}</span></div>
          <div style="margin-bottom: 8px;"><strong>${s.date}:</strong> <span style="color: #555;">${formattedDate}</span></div>
          <div style="margin-bottom: 8px;"><strong>${s.time}:</strong> <span style="color: #555;">${booking.activityTime || s.toConfirm}</span></div>
          <div style="margin-bottom: 8px;"><strong>${s.quantity}:</strong> <span style="color: #555;">${booking.pax} ${s.unitsPax}</span></div>
          ${hasBookingFee ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eeeeee;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #666;">
                <span>${s.activityTotal}:</span><span>${((booking.totalPrice) + (booking.bookingFee)).toFixed(2)}€</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; color: #10b981;">
                <span>${s.depositPaid}:</span><span>-${(booking.bookingFee).toFixed(2)}€</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 18px; color: #0056b3;">
                <strong>${s.beachBalance}:</strong><strong>${(booking.totalPrice).toFixed(2)}€</strong>
              </div>
            </div>
          ` : `
            <div style="margin-top: 12px; font-size: 18px; color: #0056b3;"><strong>${s.totalPrice}:</strong> ${booking.totalPrice.toFixed(2)}€</div>
            <div style="font-size: 12px; color: #999; margin-top: 4px;">${s.payAtArrival}</div>
          `}
          <div style="margin-top: 15px; font-size: 12px; color: #888;"><strong>${s.source}:</strong> DIRECT</div>
        </div>
      </div>
      <div style="text-align: center; margin: 40px 0; background-color: #fff; padding: 30px; border-radius: 12px; border: 1px dashed #ddd;">
        <p style="font-weight: bold; font-size: 15px; margin-bottom: 20px; color: #555;">${s.qrInstruction}</p>
        <div style="display: inline-block; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
          <img src="cid:qrcode_cid" alt="QR Code" style="width: 250px; height: 250px; display: block;" />
        </div>
        <p style="font-size: 11px; color: #999; margin-top: 15px; font-family: monospace;">ID: test-${lang}-001</p>
      </div>
      <div style="background-color: #fff8eb; padding: 15px 20px; border-radius: 10px; border-left: 4px solid #f59e0b; margin-top: 20px;">
        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.4;">
          <strong>${s.important}</strong> ${s.briefing}
        </p>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0;" />
      <div style="text-align: center; color: #888; font-size: 13px; line-height: 1.6;">
        <p style="font-weight: 600; color: #555; margin-bottom: 4px;">Desportos Náuticos Alvor</p>
        <p style="margin: 0;">Praia dos Três Irmãos, Alvor, Algarve</p>
        <p style="margin: 5px 0 0 0; color: #7c3aed; font-size: 12px;">Pesquise por "Desportos Náuticos Alvor - Watersports" no Google Maps.</p>
      </div>
    </div>
  `;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== "dna-test-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No RESEND_API_KEY" }, { status: 500 });

  const resend = new Resend(apiKey);
  const TO = "pedrotovarporto@gmail.com";

  const booking = {
    customerName: "Pedro Tovar",
    activityType: "Kayak Tour",
    activityDate: "2026-07-15",
    activityTime: "10:00",
    pax: 2,
    totalPrice: 45.00,
    bookingFee: 0,
    source: "DIRECT",
  };

  const bookingWithFee = { ...booking, totalPrice: 35.00, bookingFee: 10.00 };

  const qrBuffer = await QRCode.toBuffer(`${baseUrl}/check-in/test-booking-id`, {
    width: 500, margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const langs: Lang[] = ["pt", "en", "es", "fr", "de"];
  const results: Record<string, any> = {};

  for (const lang of langs) {
    if (langs.indexOf(lang) > 0) await new Promise(r => setTimeout(r, 700));
    // Alternate between fee/no-fee to test both layouts
    const bk = lang === "pt" ? bookingWithFee : booking;
    const { data, error } = await resend.emails.send({
      from: "Desportos Náuticos Alvor <booking@desportosnauticosalvor.com>",
      to: TO,
      subject: T[lang].subject(booking.customerName) + ` [TEST - ${lang.toUpperCase()}]`,
      attachments: [{
        filename: "qrcode.png",
        content: qrBuffer,
        contentType: "image/png",
        contentId: "qrcode_cid",
      }],
      html: buildHtml(lang, bk),
    });
    results[lang] = error ? { error } : { id: data?.id };
  }

  return NextResponse.json({ sent: langs, results });
}
