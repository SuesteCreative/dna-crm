// ⚠️  PERMANENT ROUTE — DO NOT RENAME OR MOVE THIS FILE
// 88 QR codes have been professionally printed and physically attached to beach umbrella
// stakes at Trópico (spots 1–48) and Subnauta (spots 1–40). The URL pattern
// /concessao/book/[slug]/[spotNumber] is encoded in every QR code.
// Changing this route requires a full reprint. If the domain changes, set up a redirect.
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Waves, TreePalm, Calendar } from "lucide-react";
import "../../book.css";

// ── Translations ─────────────────────────────────────────────────────────────

const LANGS = ["pt", "en", "es", "fr", "de"] as const;
type Lang = (typeof LANGS)[number];

const FLAGS: Record<Lang, string> = { pt: "🇵🇹", en: "🇬🇧", es: "🇪🇸", fr: "🇫🇷", de: "🇩🇪" };

const T: Record<Lang, Record<string, string>> = {
  pt: {
    loading: "A carregar...",
    occupied: "Chapéu ocupado",
    occupiedSub: "Este chapéu está totalmente ocupado para hoje.",
    availableNearby: "Chapéus disponíveis próximos:",
    walkTo: "Dirija-se ao chapéu indicado e leia o QR code.",
    period: "Modalidade",
    morning: "Manhã",
    morningHours: "09h–14h",
    afternoon: "Tarde",
    afternoonHours: "14h–19h",
    fullDay: "Dia Inteiro",
    fullDayHours: "09h–19h",
    pastCutoff: "Período encerrado",
    extraBed: "+ Cama Extra",
    name: "Nome *",
    namePlaceholder: "O seu nome",
    phone: "Telefone (opcional)",
    phonePlaceholder: "+351 9xx xxx xxx",
    total: "Total",
    pay: "Pagar",
    callStaff: "Chamar Staff / Pagar em Numerário",
    staffName: "O seu nome (opcional)",
    sendRequest: "Enviar Pedido",
    staffSent: "✓ Staff avisado. Por favor aguarde no seu chapéu.",
    spotTaken: "Chapéu ocupado! Por favor recarregue a página.",
    allOccupied: "Todos os chapéus estão ocupados. Chame o staff.",
    modeToday: "Hoje",
    modeReservation: "Reserva",
    startDate: "Chegada *",
    endDate: "Saída *",
    days: "dia(s)",
    discount: "Desconto",
    freeDay: "dia(s) gratuito(s)",
    reserve: "Reservar",
    conflictError: "Chapéu não disponível nesse período.",
    nearbyAvailable: "Chapéus próximos disponíveis:",
    walkToNearby: "Dirija-se ao chapéu indicado e leia o QR code.",
    refundPolicy: "Reembolso total até 48h antes da chegada. Stripe processa em 5–10 dias úteis.",
    beachClosed: "A praia está encerrada para hoje.",
    beachClosedSub: "Use o separador \"Reserva\" para reservar dias futuros.",
    errorReload: "Erro ao carregar. Recarregue a página.",
  },
  en: {
    loading: "Loading...",
    occupied: "Seat occupied",
    occupiedSub: "This seat is fully booked for today.",
    availableNearby: "Available nearby seats:",
    walkTo: "Please walk to the indicated seat and scan its QR code.",
    period: "Period",
    morning: "Morning",
    morningHours: "09:00–14:00",
    afternoon: "Afternoon",
    afternoonHours: "14:00–19:00",
    fullDay: "Full Day",
    fullDayHours: "09:00–19:00",
    pastCutoff: "Session ended",
    extraBed: "+ Extra Sunbed",
    name: "Name *",
    namePlaceholder: "Your name",
    phone: "Phone (optional)",
    phonePlaceholder: "+351 9xx xxx xxx",
    total: "Total",
    pay: "Pay",
    callStaff: "Call Staff / Pay with Cash",
    staffName: "Your name (optional)",
    sendRequest: "Send Request",
    staffSent: "✓ Staff notified. Please wait at your seat.",
    spotTaken: "Seat taken! Please reload the page.",
    allOccupied: "All seats are occupied. Please call staff.",
    modeToday: "Today",
    modeReservation: "Reserve",
    startDate: "Arrival *",
    endDate: "Departure *",
    days: "day(s)",
    discount: "Discount",
    freeDay: "free day(s)",
    reserve: "Reserve",
    conflictError: "Seat not available for that period.",
    nearbyAvailable: "Available nearby seats:",
    walkToNearby: "Please walk to the indicated seat and scan its QR code.",
    refundPolicy: "Full refund up to 48h before arrival. Stripe processes refunds within 5–10 business days.",
    beachClosed: "The beach is closed for today.",
    beachClosedSub: "Use the \"Reserve\" tab to book future dates.",
    errorReload: "Failed to load. Please reload the page.",
  },
  es: {
    loading: "Cargando...",
    occupied: "Sombrilla ocupada",
    occupiedSub: "Esta sombrilla está totalmente ocupada hoy.",
    availableNearby: "Sombrillas disponibles cercanas:",
    walkTo: "Por favor, diríjase a la sombrilla indicada y escanee su código QR.",
    period: "Período",
    morning: "Mañana",
    morningHours: "09:00–14:00",
    afternoon: "Tarde",
    afternoonHours: "14:00–19:00",
    fullDay: "Día Completo",
    fullDayHours: "09:00–19:00",
    pastCutoff: "Período cerrado",
    extraBed: "+ Hamaca Extra",
    name: "Nombre *",
    namePlaceholder: "Su nombre",
    phone: "Teléfono (opcional)",
    phonePlaceholder: "+351 9xx xxx xxx",
    total: "Total",
    pay: "Pagar",
    callStaff: "Llamar al Staff / Pagar en Efectivo",
    staffName: "Su nombre (opcional)",
    sendRequest: "Enviar Solicitud",
    staffSent: "✓ Staff avisado. Por favor espere en su sombrilla.",
    spotTaken: "¡Sombrilla ocupada! Por favor, recargue la página.",
    allOccupied: "Todas las sombrillas están ocupadas. Llame al personal.",
    modeToday: "Hoy",
    modeReservation: "Reservar",
    startDate: "Llegada *",
    endDate: "Salida *",
    days: "día(s)",
    discount: "Descuento",
    freeDay: "día(s) gratis",
    reserve: "Reservar",
    conflictError: "Sombrilla no disponible para ese período.",
    nearbyAvailable: "Sombrillas cercanas disponibles:",
    walkToNearby: "Por favor, diríjase a la sombrilla indicada y escanee su código QR.",
    refundPolicy: "Reembolso total hasta 48h antes de la llegada. Stripe procesa en 5–10 días hábiles.",
    beachClosed: "La playa está cerrada por hoy.",
    beachClosedSub: "Use el separador \"Reservar\" para reservar días futuros.",
    errorReload: "Error al cargar. Recargue la página.",
  },
  fr: {
    loading: "Chargement...",
    occupied: "Parasol occupé",
    occupiedSub: "Ce parasol est entièrement réservé pour aujourd'hui.",
    availableNearby: "Parasols disponibles à proximité :",
    walkTo: "Rendez-vous au parasol indiqué et scannez son QR code.",
    period: "Période",
    morning: "Matin",
    morningHours: "09h–14h",
    afternoon: "Après-midi",
    afternoonHours: "14h–19h",
    fullDay: "Journée complète",
    fullDayHours: "09h–19h",
    pastCutoff: "Période terminée",
    extraBed: "+ Transat supplémentaire",
    name: "Nom *",
    namePlaceholder: "Votre nom",
    phone: "Téléphone (optionnel)",
    phonePlaceholder: "+351 9xx xxx xxx",
    total: "Total",
    pay: "Payer",
    callStaff: "Appeler le Staff / Payer en espèces",
    staffName: "Votre nom (optionnel)",
    sendRequest: "Envoyer la demande",
    staffSent: "✓ Staff prévenu. Veuillez attendre à votre parasol.",
    spotTaken: "Parasol occupé ! Veuillez recharger la page.",
    allOccupied: "Tous les parasols sont occupés. Appelez le personnel.",
    modeToday: "Aujourd'hui",
    modeReservation: "Réserver",
    startDate: "Arrivée *",
    endDate: "Départ *",
    days: "jour(s)",
    discount: "Réduction",
    freeDay: "jour(s) gratuit(s)",
    reserve: "Réserver",
    conflictError: "Parasol non disponible pour cette période.",
    nearbyAvailable: "Parasols disponibles à proximité :",
    walkToNearby: "Rendez-vous au parasol indiqué et scannez son QR code.",
    refundPolicy: "Remboursement complet jusqu'à 48h avant l'arrivée. Stripe traite en 5–10 jours ouvrables.",
    beachClosed: "La plage est fermée pour aujourd'hui.",
    beachClosedSub: "Utilisez l'onglet \"Réserver\" pour réserver des dates futures.",
    errorReload: "Échec du chargement. Rechargez la page.",
  },
  de: {
    loading: "Wird geladen...",
    occupied: "Sonnenschirm belegt",
    occupiedSub: "Dieser Sonnenschirm ist für heute vollständig belegt.",
    availableNearby: "Verfügbare Sonnenschirme in der Nähe:",
    walkTo: "Bitte gehen Sie zum angezeigten Sonnenschirm und scannen Sie dessen QR-Code.",
    period: "Zeitraum",
    morning: "Vormittag",
    morningHours: "09:00–14:00",
    afternoon: "Nachmittag",
    afternoonHours: "14:00–19:00",
    fullDay: "Ganzer Tag",
    fullDayHours: "09:00–19:00",
    pastCutoff: "Zeitraum beendet",
    extraBed: "+ Extra Liegestuhl",
    name: "Name *",
    namePlaceholder: "Ihr Name",
    phone: "Telefon (optional)",
    phonePlaceholder: "+351 9xx xxx xxx",
    total: "Gesamt",
    pay: "Bezahlen",
    callStaff: "Personal rufen / Bar bezahlen",
    staffName: "Ihr Name (optional)",
    sendRequest: "Anfrage senden",
    staffSent: "✓ Personal benachrichtigt. Bitte warten Sie an Ihrem Sonnenschirm.",
    spotTaken: "Sonnenschirm belegt! Bitte laden Sie die Seite neu.",
    allOccupied: "Alle Sonnenschirme sind belegt. Rufen Sie das Personal.",
    modeToday: "Heute",
    modeReservation: "Reservieren",
    startDate: "Anreise *",
    endDate: "Abreise *",
    days: "Tag(e)",
    discount: "Rabatt",
    freeDay: "kostenloser Tag/Tage",
    reserve: "Reservieren",
    conflictError: "Sonnenschirm für diesen Zeitraum nicht verfügbar.",
    nearbyAvailable: "Verfügbare Sonnenschirme in der Nähe:",
    walkToNearby: "Bitte gehen Sie zum angezeigten Sonnenschirm und scannen Sie dessen QR-Code.",
    refundPolicy: "Volle Rückerstattung bis 48h vor Ankunft. Stripe bearbeitet in 5–10 Werktagen.",
    beachClosed: "Der Strand ist für heute geschlossen.",
    beachClosedSub: "Nutzen Sie den Reiter \"Reservieren\" für zukünftige Daten.",
    errorReload: "Ladefehler. Bitte Seite neu laden.",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns current hour (0-23) in Europe/Lisbon timezone. */
function lisbonHour(): number {
  return parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Lisbon", hour: "numeric", hour12: false }).format(new Date()),
    10
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SpotInfo {
  spotId: string;
  spotNumber: number;
  row: number;
  col: number;
  takenPeriods: string[];
}

interface ConcessionInfo {
  id: string;
  name: string;
  priceFull: number;
  priceMorning: number;
  priceAfternoon: number;
  priceExtraBed: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const { slug, spotNumber } = useParams<{ slug: string; spotNumber: string }>();
  const spotNum = Number(spotNumber);

  const [lang, setLang] = useState<Lang>("pt");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [concession, setConcession] = useState<ConcessionInfo | null>(null);
  const [allSpots, setAllSpots] = useState<SpotInfo[]>([]);
  const [thisSpot, setThisSpot] = useState<SpotInfo | null>(null);

  // Mode toggle
  const [mode, setMode] = useState<"daily" | "reservation">("daily");

  // Daily mode state
  const [period, setPeriod] = useState<"MORNING" | "AFTERNOON" | "FULL_DAY" | null>(null);
  const [extraBed, setExtraBed] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reservation mode state
  const [resStartDate, setResStartDate] = useState("");
  const [resEndDate, setResEndDate] = useState("");
  const [resPeriod, setResPeriod] = useState<"MORNING" | "AFTERNOON" | "FULL_DAY" | null>(null);
  const [resExtraBed, setResExtraBed] = useState(false);
  const [resClientName, setResClientName] = useState("");
  const [resClientPhone, setResClientPhone] = useState("");
  const [resSubmitting, setResSubmitting] = useState(false);
  const [resError, setResError] = useState<string | null>(null);
  const [resNearbySpots, setResNearbySpots] = useState<number[]>([]);

  // Staff request state
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffSent, setStaffSent] = useState(false);
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  const t = T[lang];

  // Auto-detect language once on mount
  useEffect(() => {
    const l = navigator.language.slice(0, 2).toLowerCase() as Lang;
    if (LANGS.includes(l)) setLang(l);
  }, []);

  // Load all data from a single public endpoint
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const res = await fetch(`/api/concessions/${slug}/spot-availability`);
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();

        setConcession({
          id: data.concessionId ?? "",
          name: data.concessionName ?? (slug === "subnauta" ? "Subnauta" : "Trópico"),
          ...data.pricing,
        });
        setAllSpots(data.spots ?? []);
        const found = (data.spots ?? []).find((s: SpotInfo) => s.spotNumber === spotNum);
        setThisSpot(found ?? null);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, spotNum]);

  // ── Period availability ───────────────────────────────────────────────────

  /** Whether the period has passed (time-based, Lisbon timezone). */
  const isPastCutoff = (p: string): boolean => {
    const h = lisbonHour();
    if (p === "MORNING") return h >= 14;
    if (p === "FULL_DAY") return h >= 14; // can't buy full day in the afternoon
    if (p === "AFTERNOON") return h >= 19;
    return false;
  };

  const periodTaken = (p: string): boolean => {
    if (isPastCutoff(p)) return true;
    if (!thisSpot) return true;
    return thisSpot.takenPeriods.includes(p) || thisSpot.takenPeriods.includes("FULL_DAY");
  };

  const isBeachClosed = (): boolean => {
    const available = (["MORNING", "AFTERNOON", "FULL_DAY"] as const).filter(
      (p) => !isPastCutoff(p)
    );
    return available.length === 0;
  };

  const isFullyOccupied = (): boolean => {
    if (!thisSpot) return false;
    // A spot is "fully occupied" if ALL non-time-locked periods are taken
    const available = (["MORNING", "AFTERNOON", "FULL_DAY"] as const).filter(
      (p) => !isPastCutoff(p)
    );
    if (available.length === 0) return false; // beach closed for today
    return available.every((p) => periodTaken(p));
  };

  // Nearby free spots for daily occupied state
  const nearbyFree = thisSpot
    ? allSpots
        .filter((s) => {
          if (s.spotNumber === spotNum) return false;
          const available = (["MORNING", "AFTERNOON", "FULL_DAY"] as const).filter(
            (p) => !isPastCutoff(p)
          );
          return available.some((p) => !s.takenPeriods.includes(p) && !s.takenPeriods.includes("FULL_DAY"));
        })
        .map((s) => ({
          ...s,
          dist: Math.sqrt((s.row - thisSpot.row) ** 2 + (s.col - thisSpot.col) ** 2),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 4)
    : [];

  // ── Price calculation ─────────────────────────────────────────────────────

  const calcDailyPrice = (): number => {
    if (!concession || !period) return 0;
    let base =
      period === "MORNING" ? concession.priceMorning :
      period === "AFTERNOON" ? concession.priceAfternoon :
      concession.priceFull;
    if (extraBed) base += concession.priceExtraBed;
    return base;
  };

  const calcResPrice = () => {
    if (!concession || !resPeriod || !resStartDate || !resEndDate) return { total: 0, days: 0, freeDays: 0, dayPrice: 0, bedExtra: 0 };
    const start = new Date(resStartDate + "T12:00:00Z");
    const end = new Date(resEndDate + "T12:00:00Z");
    if (end < start) return { total: 0, days: 0, freeDays: 0, dayPrice: 0, bedExtra: 0 };
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const freeDays = Math.floor(days / 7);
    const billableDays = days - freeDays;
    const dayPrice =
      resPeriod === "MORNING" ? concession.priceMorning :
      resPeriod === "AFTERNOON" ? concession.priceAfternoon :
      concession.priceFull;
    const bedExtra = resExtraBed ? concession.priceExtraBed : 0;
    const total = billableDays * (dayPrice + bedExtra);
    return { total, days, freeDays, dayPrice, bedExtra };
  };

  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handlePay = async () => {
    if (!period || !clientName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/concessions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, spotNumber: spotNum, period, extraBed, clientName, clientPhone }),
      });
      const data = await res.json();
      if (res.status === 409) { setError(t.spotTaken); return; }
      if (!res.ok || !data.url) { setError(data.error ?? "Erro. Tente novamente."); return; }
      window.location.href = data.url;
    } finally {
      setSubmitting(false);
    }
  };

  const handleReserve = async () => {
    if (!resPeriod || !resClientName.trim() || !resStartDate || !resEndDate) return;
    setResSubmitting(true);
    setResError(null);
    setResNearbySpots([]);
    try {
      const res = await fetch("/api/concessions/reservation-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, spotNumber: spotNum, startDate: resStartDate, endDate: resEndDate,
          period: resPeriod, extraBed: resExtraBed, clientName: resClientName, clientPhone: resClientPhone,
        }),
      });
      const data = await res.json();
      if (res.status === 409) { setResError(t.conflictError); setResNearbySpots(data.nearbySpots ?? []); return; }
      if (!res.ok || !data.url) { setResError(data.error ?? "Erro. Tente novamente."); return; }
      window.location.href = data.url;
    } finally {
      setResSubmitting(false);
    }
  };

  const handleStaffRequest = async () => {
    setStaffSubmitting(true);
    try {
      await fetch("/api/concessions/staff-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, spotNumber: spotNum, clientName: staffName || clientName || resClientName || null }),
      });
      setStaffSent(true);
    } finally {
      setStaffSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const theme = slug === "subnauta" ? "subnauta" : "tropico";
  const Icon = slug === "subnauta" ? Waves : TreePalm;
  const beachClosed = isBeachClosed();
  const occupied = isFullyOccupied();
  const { total: resTotal, days: resDays, freeDays, dayPrice, bedExtra } = calcResPrice();
  const resValid = !!(resPeriod && resClientName.trim() && resStartDate && resEndDate && resEndDate >= resStartDate && resDays > 0);

  const todayLabel = new Date().toLocaleDateString(
    lang === "pt" ? "pt-PT" : lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : "en-GB",
    { weekday: "long", day: "numeric", month: "long" }
  );

  if (loading) {
    return (
      <div className="book-page">
        <div className={`book-header ${theme}`}>
          <Icon size={28} className="book-header-icon" />
          <div>
            <div className="book-header-title">{slug === "subnauta" ? "Subnauta" : "Trópico"}</div>
            <div className="book-header-sub">Chapéu {spotNum}</div>
          </div>
        </div>
        <div className="book-loading">{t.loading}</div>
      </div>
    );
  }

  return (
    <div className="book-page">
      <div className={`book-header ${theme}`}>
        <Icon size={28} className="book-header-icon" />
        <div>
          <div className="book-header-title">{concession?.name ?? (slug === "subnauta" ? "Subnauta" : "Trópico")}</div>
          <div className="book-header-sub">Chapéu {spotNum}</div>
        </div>
      </div>

      <div className="book-card">
        {/* Language selector */}
        <div className="book-lang-row">
          {LANGS.map((l) => (
            <button
              key={l}
              className={`book-lang-btn ${lang === l ? `active ${theme}` : ""}`}
              onClick={() => setLang(l)}
            >
              {FLAGS[l]}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className={`book-mode-toggle ${theme}`}>
          <button
            className={`book-mode-btn ${mode === "daily" ? `active ${theme}` : ""}`}
            onClick={() => setMode("daily")}
          >
            <Calendar size={14} /> {t.modeToday}
          </button>
          <button
            className={`book-mode-btn ${mode === "reservation" ? `active ${theme}` : ""}`}
            onClick={() => setMode("reservation")}
          >
            {t.modeReservation}
          </button>
        </div>

        <div className="book-card-body">

          {loadError && (
            <div className="book-error" style={{ marginBottom: 0 }}>{t.errorReload}</div>
          )}

          {/* ── DAILY MODE ─────────────────────────────────────────── */}
          {!loadError && mode === "daily" && (
            <>
              <div className="book-date-row">
                <Calendar size={14} />
                <span style={{ textTransform: "capitalize" }}>{todayLabel}</span>
              </div>

              {beachClosed ? (
                <>
                  <div className="book-occupied-badge">
                    <div className="book-occupied-title">{t.beachClosed}</div>
                    <div className="book-occupied-sub">{t.beachClosedSub}</div>
                  </div>
                  <div className="book-actions" style={{ marginTop: 16 }}>
                    <button className="book-btn-staff" onClick={() => setShowStaffForm((v) => !v)}>
                      {t.callStaff}
                    </button>
                  </div>
                </>
              ) : occupied ? (
                <>
                  <div className="book-occupied-badge">
                    <div className="book-occupied-title">{t.occupied}</div>
                    <div className="book-occupied-sub">{t.occupiedSub}</div>
                  </div>
                  {nearbyFree.length > 0 ? (
                    <div className="book-alternatives">
                      <div className="book-alternatives-label">{t.availableNearby}</div>
                      <div className="book-alt-spots">
                        {nearbyFree.map((s) => (
                          <div key={s.spotId} className="book-alt-spot">{s.spotNumber}</div>
                        ))}
                      </div>
                      <div className="book-alt-walk">{t.walkTo}</div>
                    </div>
                  ) : (
                    <div className="book-occupied-badge" style={{ marginTop: 0 }}>
                      <div className="book-occupied-sub">{t.allOccupied}</div>
                    </div>
                  )}
                  <div className="book-actions" style={{ marginTop: 16 }}>
                    <button className="book-btn-staff" onClick={() => setShowStaffForm((v) => !v)}>
                      {t.callStaff}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {error && <div className="book-error">{error}</div>}

                  <div className="book-period-label">{t.period}</div>
                  <div className="book-periods">
                    {(["MORNING", "AFTERNOON", "FULL_DAY"] as const).map((p) => {
                      const taken = periodTaken(p);
                      const timeLocked = isPastCutoff(p);
                      const label = p === "MORNING" ? t.morning : p === "AFTERNOON" ? t.afternoon : t.fullDay;
                      const hours = p === "MORNING" ? t.morningHours : p === "AFTERNOON" ? t.afternoonHours : t.fullDayHours;
                      const price = concession
                        ? p === "MORNING" ? concession.priceMorning
                        : p === "AFTERNOON" ? concession.priceAfternoon
                        : concession.priceFull
                        : 0;
                      return (
                        <button
                          key={p}
                          className={`book-period-btn ${period === p ? `active ${theme}` : ""} ${taken ? "taken" : ""}`}
                          disabled={taken}
                          onClick={() => setPeriod(p)}
                        >
                          <span className="period-label">{label}</span>
                          <span className="period-hours">{timeLocked ? t.pastCutoff : hours}</span>
                          <span className="period-price">{taken ? "—" : `${price.toFixed(2)}€`}</span>
                        </button>
                      );
                    })}
                  </div>

                  {period && (
                    <>
                      <label className={`book-extra-bed ${theme}`}>
                        <input
                          type="checkbox"
                          checked={extraBed}
                          onChange={(e) => setExtraBed(e.target.checked)}
                        />
                        <span className="book-extra-bed-label">{t.extraBed}</span>
                        <span className="book-extra-bed-price">+{concession?.priceExtraBed.toFixed(2)}€</span>
                      </label>

                      <div className="book-field">
                        <label>{t.name}</label>
                        <input
                          type="text"
                          placeholder={t.namePlaceholder}
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                        />
                      </div>
                      <div className={`book-field`}>
                        <label>{t.phone}</label>
                        <input
                          type="tel"
                          placeholder={t.phonePlaceholder}
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                        />
                      </div>

                      <div className={`book-price-summary ${theme}`}>
                        <span className="book-price-label">{t.total}</span>
                        <span className="book-price-total">{calcDailyPrice().toFixed(2)}€</span>
                      </div>

                      <div className="book-actions">
                        <button
                          className={`book-btn-pay ${theme}`}
                          disabled={submitting || !clientName.trim()}
                          onClick={handlePay}
                        >
                          {submitting ? "..." : `${t.pay} ${calcDailyPrice().toFixed(2)}€`}
                        </button>
                        <button className="book-btn-staff" onClick={() => setShowStaffForm((v) => !v)}>
                          {t.callStaff}
                        </button>
                      </div>
                    </>
                  )}

                  {!period && (
                    <div className="book-actions" style={{ marginTop: 8 }}>
                      <button className="book-btn-staff" onClick={() => setShowStaffForm((v) => !v)}>
                        {t.callStaff}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── RESERVATION MODE ───────────────────────────────────── */}
          {!loadError && mode === "reservation" && (
            <>
              {resError && (
                <div className="book-error">
                  {resError}
                  {resNearbySpots.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div className="book-alternatives-label">{t.nearbyAvailable}</div>
                      <div className="book-alt-spots" style={{ marginTop: 8 }}>
                        {resNearbySpots.map((n) => (
                          <div key={n} className="book-alt-spot">{n}</div>
                        ))}
                      </div>
                      <div className="book-alt-walk" style={{ marginTop: 8 }}>{t.walkToNearby}</div>
                    </div>
                  )}
                </div>
              )}

              <div className="book-res-dates">
                <div className="book-field">
                  <label>{t.startDate}</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={resStartDate}
                    onChange={(e) => {
                      setResStartDate(e.target.value);
                      if (resEndDate && e.target.value > resEndDate) setResEndDate(e.target.value);
                      setResError(null); setResNearbySpots([]);
                    }}
                  />
                </div>
                <div className="book-field">
                  <label>{t.endDate}</label>
                  <input
                    type="date"
                    min={resStartDate || todayStr}
                    value={resEndDate}
                    onChange={(e) => { setResEndDate(e.target.value); setResError(null); setResNearbySpots([]); }}
                  />
                </div>
              </div>

              <div className="book-period-label">{t.period}</div>
              <div className="book-periods">
                {(["MORNING", "AFTERNOON", "FULL_DAY"] as const).map((p) => {
                  const label = p === "MORNING" ? t.morning : p === "AFTERNOON" ? t.afternoon : t.fullDay;
                  const hours = p === "MORNING" ? t.morningHours : p === "AFTERNOON" ? t.afternoonHours : t.fullDayHours;
                  const price = concession
                    ? p === "MORNING" ? concession.priceMorning
                    : p === "AFTERNOON" ? concession.priceAfternoon
                    : concession.priceFull
                    : 0;
                  return (
                    <button
                      key={p}
                      className={`book-period-btn ${resPeriod === p ? `active ${theme}` : ""}`}
                      onClick={() => { setResPeriod(p); setResError(null); setResNearbySpots([]); }}
                    >
                      <span className="period-label">{label}</span>
                      <span className="period-hours">{hours}</span>
                      <span className="period-price">{price.toFixed(2)}€</span>
                    </button>
                  );
                })}
              </div>

              <label className={`book-extra-bed ${theme}`}>
                <input
                  type="checkbox"
                  checked={resExtraBed}
                  onChange={(e) => setResExtraBed(e.target.checked)}
                />
                <span className="book-extra-bed-label">{t.extraBed}</span>
                <span className="book-extra-bed-price">+{concession?.priceExtraBed.toFixed(2)}€</span>
              </label>

              <div className="book-field">
                <label>{t.name}</label>
                <input
                  type="text"
                  placeholder={t.namePlaceholder}
                  value={resClientName}
                  onChange={(e) => setResClientName(e.target.value)}
                />
              </div>
              <div className="book-field">
                <label>{t.phone}</label>
                <input
                  type="tel"
                  placeholder={t.phonePlaceholder}
                  value={resClientPhone}
                  onChange={(e) => setResClientPhone(e.target.value)}
                />
              </div>

              {resPeriod && resStartDate && resEndDate && resDays > 0 && (
                <div className={`book-price-summary ${theme} column`}>
                  <div className="book-price-breakdown">
                    <span>{resDays} {t.days} × {(dayPrice + bedExtra).toFixed(2)}€</span>
                  </div>
                  {freeDays > 0 && (
                    <div className="book-price-breakdown discount">
                      <span>{t.discount}: −{freeDays} {t.freeDay}</span>
                      <span>−{(freeDays * (dayPrice + bedExtra)).toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="book-price-row-total">
                    <span>{t.total}</span>
                    <span className="book-price-total">{resTotal.toFixed(2)}€</span>
                  </div>
                </div>
              )}

              <div className="book-refund-policy">{t.refundPolicy}</div>

              <div className="book-actions">
                <button
                  className={`book-btn-pay ${theme}`}
                  disabled={resSubmitting || !resValid}
                  onClick={handleReserve}
                >
                  {resSubmitting ? "..." : `${t.reserve}${resTotal > 0 ? ` ${resTotal.toFixed(2)}€` : ""}`}
                </button>
                <button className="book-btn-staff" onClick={() => setShowStaffForm((v) => !v)}>
                  {t.callStaff}
                </button>
              </div>
            </>
          )}

          {/* Staff request form */}
          {showStaffForm && !staffSent && (
            <div className="book-staff-form">
              <input
                type="text"
                placeholder={t.staffName}
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
              <button
                className="book-btn-staff-submit"
                onClick={handleStaffRequest}
                disabled={staffSubmitting}
              >
                {staffSubmitting ? "..." : t.sendRequest}
              </button>
            </div>
          )}
          {staffSent && <div className="book-staff-sent">{t.staffSent}</div>}
        </div>
      </div>
    </div>
  );
}
