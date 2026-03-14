"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import "../../../book.css";

const LANGS = ["pt", "en", "es", "fr", "de"] as const;
type Lang = (typeof LANGS)[number];

const T: Record<Lang, Record<string, string>> = {
  pt: {
    confirmedDaily: "Pagamento confirmado!",
    confirmedRes: "Reserva confirmada!",
    subDaily: "O seu lugar está reservado. Pode acomodar-se.",
    subRes: "A sua reserva está confirmada. Até breve!",
    seat: "Chapéu",
    date: "Data",
    period: "Modalidade",
    morning: "Manhã · 09h–14h",
    afternoon: "Tarde · 14h–19h",
    fullDay: "Dia Inteiro · 09h–19h",
    dates: "Período",
    days: "dias",
    freeDays: "dia(s) gratuito(s)",
    discount: "Desconto",
    total: "Total (IVA 23% incluído)",
    back: "Voltar ao Chapéu",
  },
  en: {
    confirmedDaily: "Payment confirmed!",
    confirmedRes: "Reservation confirmed!",
    subDaily: "Your seat is reserved. You may take your place.",
    subRes: "Your reservation is confirmed. See you soon!",
    seat: "Seat",
    date: "Date",
    period: "Period",
    morning: "Morning · 09:00–14:00",
    afternoon: "Afternoon · 14:00–19:00",
    fullDay: "Full Day · 09:00–19:00",
    dates: "Dates",
    days: "days",
    freeDays: "free day(s)",
    discount: "Discount",
    total: "Total (23% VAT included)",
    back: "Back to Seat",
  },
  es: {
    confirmedDaily: "¡Pago confirmado!",
    confirmedRes: "¡Reserva confirmada!",
    subDaily: "Su sombrilla está reservada. Puede acomodarse.",
    subRes: "Su reserva está confirmada. ¡Hasta pronto!",
    seat: "Sombrilla",
    date: "Fecha",
    period: "Período",
    morning: "Mañana · 09:00–14:00",
    afternoon: "Tarde · 14:00–19:00",
    fullDay: "Día Completo · 09:00–19:00",
    dates: "Fechas",
    days: "días",
    freeDays: "día(s) gratis",
    discount: "Descuento",
    total: "Total (IVA 23% incluido)",
    back: "Volver a la Sombrilla",
  },
  fr: {
    confirmedDaily: "Paiement confirmé !",
    confirmedRes: "Réservation confirmée !",
    subDaily: "Votre parasol est réservé. Vous pouvez vous installer.",
    subRes: "Votre réservation est confirmée. À bientôt !",
    seat: "Parasol",
    date: "Date",
    period: "Période",
    morning: "Matin · 09h–14h",
    afternoon: "Après-midi · 14h–19h",
    fullDay: "Journée complète · 09h–19h",
    dates: "Dates",
    days: "jours",
    freeDays: "jour(s) gratuit(s)",
    discount: "Réduction",
    total: "Total (TVA 23% incluse)",
    back: "Retour au Parasol",
  },
  de: {
    confirmedDaily: "Zahlung bestätigt!",
    confirmedRes: "Reservierung bestätigt!",
    subDaily: "Ihr Sonnenschirm ist reserviert. Sie können Platz nehmen.",
    subRes: "Ihre Reservierung ist bestätigt. Bis bald!",
    seat: "Sonnenschirm",
    date: "Datum",
    period: "Zeitraum",
    morning: "Vormittag · 09:00–14:00",
    afternoon: "Nachmittag · 14:00–19:00",
    fullDay: "Ganzer Tag · 09:00–19:00",
    dates: "Zeitraum",
    days: "Tage",
    freeDays: "Gratistag(e)",
    discount: "Rabatt",
    total: "Gesamt (inkl. 23% MwSt.)",
    back: "Zurück zum Sonnenschirm",
  },
};

function formatDate(iso: string, lang: Lang): string {
  const locale = lang === "pt" ? "pt-PT" : lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : "en-GB";
  return new Date(iso + "T12:00:00Z").toLocaleDateString(locale, { day: "numeric", month: "long" });
}

export default function SuccessPage() {
  const { slug, spotNumber } = useParams<{ slug: string; spotNumber: string }>();
  const params = useSearchParams();

  const [lang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "pt";
    const l = navigator.language.slice(0, 2).toLowerCase() as Lang;
    return LANGS.includes(l) ? l : "pt";
  });

  const t = T[lang];
  const theme = slug === "subnauta" ? "subnauta" : "tropico";

  const type = params.get("type") ?? "daily";
  const name = params.get("name") ?? "";
  const period = params.get("period") ?? "";
  const total = params.get("total") ?? "";
  const date = params.get("date") ?? "";
  const start = params.get("start") ?? "";
  const end = params.get("end") ?? "";
  const days = Number(params.get("days") ?? 0);
  const freeDays = Number(params.get("freeDays") ?? 0);
  const periodLabel =
    period === "MORNING" ? t.morning :
    period === "AFTERNOON" ? t.afternoon : t.fullDay;

  const isRes = type === "reservation";

  return (
    <div className="book-page">
      <div className={`book-header ${theme}`} style={{ minHeight: 60 }} />
      <div className="book-result-card">
        <div className="book-result-icon">✅</div>
        <div className="book-result-title">
          {isRes ? t.confirmedRes : t.confirmedDaily}
        </div>
        <div className="book-result-sub">
          {isRes ? t.subRes : t.subDaily}
        </div>

        <div className="book-result-details">
          {name && (
            <div className="book-result-row">
              <span>{t.seat}</span>
              <span>{name} · {t.seat} {spotNumber}</span>
            </div>
          )}

          {!isRes && date && (
            <div className="book-result-row">
              <span>{t.date}</span>
              <span>{formatDate(date, lang)}</span>
            </div>
          )}

          {isRes && start && end && (
            <div className="book-result-row">
              <span>{t.dates}</span>
              <span>{formatDate(start, lang)} → {formatDate(end, lang)}</span>
            </div>
          )}

          {isRes && days > 0 && (
            <div className="book-result-row">
              <span></span>
              <span style={{ color: "#6b7280", fontSize: 13 }}>{days} {t.days}{freeDays > 0 ? ` · ${freeDays} ${t.freeDays}` : ""}</span>
            </div>
          )}

          {period && (
            <div className="book-result-row">
              <span>{t.period}</span>
              <span>{periodLabel}</span>
            </div>
          )}

          {total && (
            <div className="book-result-row total">
              <span>{t.total}</span>
              <span className="book-result-total">€{parseFloat(total).toFixed(2)}</span>
            </div>
          )}
        </div>

        <Link href={`/concessao/book/${slug}/${spotNumber}`} className="book-result-back">
          {t.back}
        </Link>
      </div>
    </div>
  );
}
