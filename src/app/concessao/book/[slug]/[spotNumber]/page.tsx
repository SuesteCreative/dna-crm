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

const T: Record<string, Record<string, string>> = {
  pt: {
    loading: "A carregar...",
    occupied: "Chapéu ocupado",
    occupiedSub: "Este chapéu está totalmente ocupado para hoje.",
    availableNearby: "Chapéus disponíveis próximos:",
    walkTo: "Dirija-se ao chapéu indicado e leia o QR code.",
    period: "Período",
    morning: "Manhã",
    morningHours: "09h00–14h00",
    afternoon: "Tarde",
    afternoonHours: "14h00–19h00",
    fullDay: "Dia Inteiro",
    extraBed: "+ Cama Extra",
    extraBedPrice: "(+preço)",
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
    // Reservation mode
    modeToday: "Hoje",
    modeReservation: "Reserva",
    startDate: "Data de chegada *",
    endDate: "Data de saída *",
    days: "dia(s)",
    discount: "Desconto",
    freeDay: "dia(s) gratuito(s)",
    reserve: "Reservar",
    conflictError: "Chapéu não disponível nesse período.",
    nearbyAvailable: "Chapéus próximos disponíveis:",
    walkToNearby: "Dirija-se ao chapéu indicado e leia o QR code.",
    refundPolicy: "Política de reembolso: reembolso total até 48h antes da chegada. Stripe processa reembolsos em 5–10 dias úteis.",
  },
  en: {
    loading: "Loading...",
    occupied: "Umbrella occupied",
    occupiedSub: "This umbrella is fully booked for today.",
    availableNearby: "Available nearby umbrellas:",
    walkTo: "Please walk to the indicated umbrella and scan its QR code.",
    period: "Period",
    morning: "Morning",
    morningHours: "09:00–14:00",
    afternoon: "Afternoon",
    afternoonHours: "14:00–19:00",
    fullDay: "Full Day",
    extraBed: "+ Extra Sunbed",
    extraBedPrice: "(+price)",
    name: "Name *",
    namePlaceholder: "Your name",
    phone: "Phone (optional)",
    phonePlaceholder: "+351 9xx xxx xxx",
    total: "Total",
    pay: "Pay",
    callStaff: "Call Staff / Pay with Cash",
    staffName: "Your name (optional)",
    sendRequest: "Send Request",
    staffSent: "✓ Staff notified. Please wait at your umbrella.",
    spotTaken: "Umbrella taken! Please reload the page.",
    allOccupied: "All umbrellas are occupied. Please call staff.",
    modeToday: "Today",
    modeReservation: "Reserve",
    startDate: "Arrival date *",
    endDate: "Departure date *",
    days: "day(s)",
    discount: "Discount",
    freeDay: "free day(s)",
    reserve: "Reserve",
    conflictError: "Umbrella not available for that period.",
    nearbyAvailable: "Available nearby umbrellas:",
    walkToNearby: "Please walk to the indicated umbrella and scan its QR code.",
    refundPolicy: "Refund policy: full refund up to 48h before arrival. Stripe processes refunds within 5–10 business days.",
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
    extraBed: "+ Hamaca Extra",
    extraBedPrice: "(+precio)",
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
    startDate: "Fecha de llegada *",
    endDate: "Fecha de salida *",
    days: "día(s)",
    discount: "Descuento",
    freeDay: "día(s) gratis",
    reserve: "Reservar",
    conflictError: "Sombrilla no disponible para ese período.",
    nearbyAvailable: "Sombrillas cercanas disponibles:",
    walkToNearby: "Por favor, diríjase a la sombrilla indicada y escanee su código QR.",
    refundPolicy: "Política de reembolso: reembolso total hasta 48h antes de la llegada. Stripe procesa los reembolsos en 5–10 días hábiles.",
  },
  fr: {
    loading: "Chargement...",
    occupied: "Parasol occupé",
    occupiedSub: "Ce parasol est entièrement réservé pour aujourd'hui.",
    availableNearby: "Parasols disponibles à proximité :",
    walkTo: "Rendez-vous au parasol indiqué et scannez son QR code.",
    period: "Période",
    morning: "Matin",
    morningHours: "09h00–14h00",
    afternoon: "Après-midi",
    afternoonHours: "14h00–19h00",
    fullDay: "Journée complète",
    extraBed: "+ Transat supplémentaire",
    extraBedPrice: "(+prix)",
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
    startDate: "Date d'arrivée *",
    endDate: "Date de départ *",
    days: "jour(s)",
    discount: "Réduction",
    freeDay: "jour(s) gratuit(s)",
    reserve: "Réserver",
    conflictError: "Parasol non disponible pour cette période.",
    nearbyAvailable: "Parasols disponibles à proximité :",
    walkToNearby: "Rendez-vous au parasol indiqué et scannez son QR code.",
    refundPolicy: "Politique de remboursement : remboursement complet jusqu'à 48h avant l'arrivée. Stripe traite les remboursements sous 5–10 jours ouvrables.",
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
    extraBed: "+ Extra Liegestuhl",
    extraBedPrice: "(+Preis)",
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
    startDate: "Anreisedatum *",
    endDate: "Abreisedatum *",
    days: "Tag(e)",
    discount: "Rabatt",
    freeDay: "kostenloser Tag/Tage",
    reserve: "Reservieren",
    conflictError: "Sonnenschirm für diesen Zeitraum nicht verfügbar.",
    nearbyAvailable: "Verfügbare Sonnenschirme in der Nähe:",
    walkToNearby: "Bitte gehen Sie zum angezeigten Sonnenschirm und scannen Sie dessen QR-Code.",
    refundPolicy: "Rückgaberichtlinie: volle Rückerstattung bis 48h vor der Ankunft. Stripe bearbeitet Rückerstattungen innerhalb von 5–10 Werktagen.",
  },
};

interface SpotInfo {
  spotId: string;
  spotNumber: number;
  row: number;
  col: number;
  takenPeriods: string[];
}

interface Pricing {
  priceFull: number;
  priceMorning: number;
  priceAfternoon: number;
  priceExtraBed: number;
}

interface ConcessionInfo {
  id: string;
  name: string;
  slug: string;
  priceFull: number;
  priceMorning: number;
  priceAfternoon: number;
  priceExtraBed: number;
}

export default function BookingPage() {
  const { slug, spotNumber } = useParams<{ slug: string; spotNumber: string }>();
  const spotNum = Number(spotNumber);

  const [lang, setLang] = useState("pt");
  const [loading, setLoading] = useState(true);
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

  const t = T[lang] ?? T.pt;

  useEffect(() => {
    const l = navigator.language.slice(0, 2).toLowerCase();
    setLang(T[l] ? l : "pt");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/concessions/${slug}/spot-availability`);
        const data = await res.json();

        // Fetch concession info
        const cRes = await fetch(`/api/concessions/${slug}`);
        const cData = await cRes.json();
        setConcession(cData);

        // Use pricing from spot-availability if concession fetch failed
        if (!cData || cData.error) {
          const pricing: Pricing = data.pricing ?? {};
          setConcession({ id: "", name: slug, slug, ...pricing } as ConcessionInfo);
        }

        setAllSpots(data.spots ?? []);
        const found = (data.spots ?? []).find((s: SpotInfo) => s.spotNumber === spotNum);
        setThisSpot(found ?? null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, spotNum]);

  const isOccupied = thisSpot
    ? ["MORNING", "AFTERNOON", "FULL_DAY"].every((p) =>
        thisSpot.takenPeriods.includes(p) ||
        (thisSpot.takenPeriods.includes("FULL_DAY") && (p === "MORNING" || p === "AFTERNOON"))
      )
    : false;

  const periodTaken = (p: string) => {
    if (!thisSpot) return true;
    return thisSpot.takenPeriods.includes(p) || thisSpot.takenPeriods.includes("FULL_DAY");
  };

  // Nearby free spots for daily occupied state (euclidean distance)
  const nearbyFree = thisSpot
    ? allSpots
        .filter(
          (s) =>
            s.spotNumber !== spotNum &&
            !["MORNING", "AFTERNOON", "FULL_DAY"].every(
              (p) => s.takenPeriods.includes(p) || s.takenPeriods.includes("FULL_DAY")
            )
        )
        .map((s) => ({
          ...s,
          dist: Math.sqrt((s.row - thisSpot.row) ** 2 + (s.col - thisSpot.col) ** 2),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 4)
    : [];

  const calcDailyPrice = () => {
    if (!concession || !period) return 0;
    let base =
      period === "MORNING" ? concession.priceMorning :
      period === "AFTERNOON" ? concession.priceAfternoon :
      concession.priceFull;
    if (extraBed) base += concession.priceExtraBed;
    return base;
  };

  // Reservation price calculation
  const calcResPrice = () => {
    if (!concession || !resPeriod || !resStartDate || !resEndDate) return { total: 0, days: 0, freeDays: 0 };
    const start = new Date(resStartDate + "T12:00:00Z");
    const end = new Date(resEndDate + "T12:00:00Z");
    if (end < start) return { total: 0, days: 0, freeDays: 0 };
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const freeDays = Math.floor(days / 7);
    const billableDays = days - freeDays;
    const dayPrice =
      resPeriod === "MORNING" ? concession.priceMorning :
      resPeriod === "AFTERNOON" ? concession.priceAfternoon :
      concession.priceFull;
    const bedExtra = resExtraBed ? concession.priceExtraBed : 0;
    const total = billableDays * (dayPrice + bedExtra);
    return { total, days, freeDays };
  };

  // Today string for date picker min values
  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });

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
          slug,
          spotNumber: spotNum,
          startDate: resStartDate,
          endDate: resEndDate,
          period: resPeriod,
          extraBed: resExtraBed,
          clientName: resClientName,
          clientPhone: resClientPhone,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setResError(t.conflictError);
        setResNearbySpots(data.nearbySpots ?? []);
        return;
      }
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
        body: JSON.stringify({
          slug,
          spotNumber: spotNum,
          clientName: staffName || clientName || resClientName || null,
        }),
      });
      setStaffSent(true);
    } finally {
      setStaffSubmitting(false);
    }
  };

  const theme = slug === "subnauta" ? "subnauta" : "tropico";
  const Icon = slug === "subnauta" ? Waves : TreePalm;
  const today = new Date().toLocaleDateString(
    lang === "pt" ? "pt-PT" : lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : "en-GB",
    { weekday: "long", day: "numeric", month: "long" }
  );

  const { total: resTotal, days: resDays, freeDays } = calcResPrice();
  const resValid = resPeriod && resClientName.trim() && resStartDate && resEndDate && resEndDate >= resStartDate && resDays > 0;

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
          <div className="book-header-title">{concession?.name ?? slug}</div>
          <div className="book-header-sub">Chapéu {spotNum}</div>
        </div>
      </div>

      <div className="book-card">
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

          {/* ── DAILY MODE ─────────────────────────────────────────── */}
          {mode === "daily" && (
            <>
              <div className="book-date-row">
                <Calendar size={15} />
                <span style={{ textTransform: "capitalize" }}>{today}</span>
              </div>

              {isOccupied ? (
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
                    <div className="book-occupied-badge">
                      <div className="book-occupied-sub">{t.allOccupied}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {error && <div className="book-error">{error}</div>}

                  <div className="book-period-label">{t.period}</div>
                  <div className="book-periods">
                    {(["MORNING", "AFTERNOON", "FULL_DAY"] as const).map((p) => {
                      const taken = periodTaken(p);
                      const label = p === "MORNING" ? t.morning : p === "AFTERNOON" ? t.afternoon : t.fullDay;
                      const hours = p === "MORNING" ? t.morningHours : p === "AFTERNOON" ? t.afternoonHours : "";
                      const price = concession
                        ? p === "MORNING" ? concession.priceMorning
                        : p === "AFTERNOON" ? concession.priceAfternoon
                        : concession.priceFull
                        : 0;
                      return (
                        <button
                          key={p}
                          className={`book-period-btn ${period === p ? `active ${theme}` : ""}`}
                          disabled={taken}
                          onClick={() => setPeriod(p)}
                        >
                          {label}
                          {hours && <><br /><small style={{ fontWeight: 400, fontSize: 11 }}>{hours}</small></>}
                          <span className="period-price">{price.toFixed(2)}€</span>
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
                      <div className={`book-field ${theme}`}>
                        <label>{t.phone}</label>
                        <input
                          type="tel"
                          placeholder={t.phonePlaceholder}
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                        />
                      </div>

                      <div className="book-price-summary">
                        <div className="book-price-row">
                          <span className="book-price-label">{t.total}</span>
                          <span className="book-price-total">{calcDailyPrice().toFixed(2)}€</span>
                        </div>
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

              {isOccupied && (
                <div className="book-actions" style={{ marginTop: 16 }}>
                  <button className="book-btn-staff" onClick={() => setShowStaffForm((v) => !v)}>
                    {t.callStaff}
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── RESERVATION MODE ───────────────────────────────────── */}
          {mode === "reservation" && (
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
                      setResError(null);
                      setResNearbySpots([]);
                    }}
                  />
                </div>
                <div className="book-field">
                  <label>{t.endDate}</label>
                  <input
                    type="date"
                    min={resStartDate || todayStr}
                    value={resEndDate}
                    onChange={(e) => {
                      setResEndDate(e.target.value);
                      setResError(null);
                      setResNearbySpots([]);
                    }}
                  />
                </div>
              </div>

              <div className="book-period-label">{t.period}</div>
              <div className="book-periods">
                {(["MORNING", "AFTERNOON", "FULL_DAY"] as const).map((p) => {
                  const label = p === "MORNING" ? t.morning : p === "AFTERNOON" ? t.afternoon : t.fullDay;
                  const hours = p === "MORNING" ? t.morningHours : p === "AFTERNOON" ? t.afternoonHours : "";
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
                      {label}
                      {hours && <><br /><small style={{ fontWeight: 400, fontSize: 11 }}>{hours}</small></>}
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
              <div className={`book-field ${theme}`}>
                <label>{t.phone}</label>
                <input
                  type="tel"
                  placeholder={t.phonePlaceholder}
                  value={resClientPhone}
                  onChange={(e) => setResClientPhone(e.target.value)}
                />
              </div>

              {resPeriod && resStartDate && resEndDate && resDays > 0 && (
                <div className="book-price-summary">
                  <div className="book-price-row" style={{ marginBottom: 4 }}>
                    <span className="book-price-label">{resDays} {t.days} × {
                      (resPeriod === "MORNING" ? concession?.priceMorning :
                       resPeriod === "AFTERNOON" ? concession?.priceAfternoon :
                       concession?.priceFull ?? 0)?.toFixed(2)
                    }€{resExtraBed && concession ? ` + ${concession.priceExtraBed.toFixed(2)}€` : ""}</span>
                  </div>
                  {freeDays > 0 && (
                    <div className="book-price-row" style={{ marginBottom: 4 }}>
                      <span className="book-price-label" style={{ color: "#16a34a" }}>
                        {t.discount}: −{freeDays} {t.freeDay}
                      </span>
                      <span style={{ fontSize: 14, color: "#16a34a", fontWeight: 700 }}>
                        −{(freeDays * ((resPeriod === "MORNING" ? concession?.priceMorning :
                           resPeriod === "AFTERNOON" ? concession?.priceAfternoon :
                           concession?.priceFull ?? 0)! + (resExtraBed && concession ? concession.priceExtraBed : 0))).toFixed(2)}€
                      </span>
                    </div>
                  )}
                  <div className="book-price-row" style={{ borderTop: "1px solid #e5e5e5", paddingTop: 10, marginTop: 6 }}>
                    <span className="book-price-label">{t.total}</span>
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
                  {resSubmitting ? "..." : `${t.reserve} ${resTotal > 0 ? resTotal.toFixed(2) + "€" : ""}`}
                </button>
                <button className="book-btn-staff" onClick={() => setShowStaffForm((v) => !v)}>
                  {t.callStaff}
                </button>
              </div>
            </>
          )}

          {/* Staff request form — always available */}
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
