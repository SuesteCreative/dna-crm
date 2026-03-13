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
  },
};

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

  const [period, setPeriod] = useState<"MORNING" | "AFTERNOON" | "FULL_DAY" | null>(null);
  const [extraBed, setExtraBed] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        // Fetch concession info from same endpoint context
        const cRes = await fetch(`/api/concessions/${slug}`);
        const cData = await cRes.json();
        setConcession(cData);

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
    return (
      thisSpot.takenPeriods.includes(p) ||
      thisSpot.takenPeriods.includes("FULL_DAY")
    );
  };

  // Nearby free spots (euclidean distance)
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

  const calcPrice = () => {
    if (!concession || !period) return 0;
    let base =
      period === "MORNING" ? concession.priceMorning :
      period === "AFTERNOON" ? concession.priceAfternoon :
      concession.priceFull;
    if (extraBed) base += concession.priceExtraBed;
    return base;
  };

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
      if (res.status === 409) {
        setError(t.spotTaken);
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error ?? "Erro. Tente novamente.");
        return;
      }
      window.location.href = data.url;
    } finally {
      setSubmitting(false);
    }
  };

  const handleStaffRequest = async () => {
    setStaffSubmitting(true);
    try {
      await fetch("/api/concessions/staff-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, spotNumber: spotNum, clientName: staffName || clientName || null }),
      });
      setStaffSent(true);
    } finally {
      setStaffSubmitting(false);
    }
  };

  const theme = slug === "subnauta" ? "subnauta" : "tropico";
  const Icon = slug === "subnauta" ? Waves : TreePalm;
  const today = new Date().toLocaleDateString(lang === "pt" ? "pt-PT" : lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : lang === "de" ? "de-DE" : "en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

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
        <div className="book-card-body">
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
                      <span className="book-price-total">{calcPrice().toFixed(2)}€</span>
                    </div>
                  </div>

                  <div className="book-actions">
                    <button
                      className={`book-btn-pay ${theme}`}
                      disabled={submitting || !clientName.trim()}
                      onClick={handlePay}
                    >
                      {submitting ? "..." : `${t.pay} ${calcPrice().toFixed(2)}€`}
                    </button>
                    <button
                      className="book-btn-staff"
                      onClick={() => setShowStaffForm((v) => !v)}
                    >
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

          {/* Staff request form — always available */}
          {isOccupied && (
            <div className="book-actions" style={{ marginTop: 16 }}>
              <button className="book-btn-staff" onClick={() => setShowStaffForm((v) => !v)}>
                {t.callStaff}
              </button>
            </div>
          )}

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
