"use client";
import { useState, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import type { ReservationInitData } from "./Reservations";

interface Concession {
  priceFull: number; priceMorning: number; priceAfternoon: number;
  priceExtraBed: number; priceOneBed: number;
}

type Discount = "none" | "free_day" | "ten_percent";

function today() { return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" }); }

function calcDays(start: string, end: string) {
  if (!start || !end) return 1;
  const s = new Date(start + "T12:00:00Z"), e = new Date(end + "T12:00:00Z");
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

interface Props {
  concession: Concession;
  onProceed?: (data: ReservationInitData) => void;
}

export default function Calculator({ concession, onProceed }: Props) {
  const [spots, setSpots] = useState(1);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [period, setPeriod] = useState("FULL_DAY");
  const [baseBeds, setBaseBeds] = useState<"ONE_BED" | "TWO_BEDS">("TWO_BEDS");
  const [extraBed, setExtraBed] = useState(false);
  const [discount, setDiscount] = useState<Discount>("none");

  const bedConfig = baseBeds === "ONE_BED" ? "ONE_BED" : extraBed ? "EXTRA_BED" : "TWO_BEDS";
  const days = calcDays(startDate, endDate);

  const { basePerDay, subtotal, discountAmount, total, freeDays, billableDays } = useMemo(() => {
    const periodPrice = period === "MORNING" ? concession.priceMorning : period === "AFTERNOON" ? concession.priceAfternoon : concession.priceFull;
    const basePerDay = bedConfig === "ONE_BED" ? concession.priceOneBed : bedConfig === "EXTRA_BED" ? periodPrice + concession.priceExtraBed : periodPrice;
    const subtotal = basePerDay * spots * days;
    let discountAmount = 0, freeDays = 0, billableDays = days;
    if (discount === "free_day" && days >= 7) {
      freeDays = Math.floor(days / 7);
      billableDays = days - freeDays;
      discountAmount = subtotal - basePerDay * spots * billableDays;
    } else if (discount === "ten_percent" && days > 7) {
      discountAmount = subtotal * 0.1;
    }
    return { basePerDay, subtotal, discountAmount, total: subtotal - discountAmount, freeDays, billableDays };
  }, [spots, days, period, bedConfig, discount, concession]);

  const periodLabel = period === "MORNING" ? "Manhã" : period === "AFTERNOON" ? "Tarde" : "Dia Inteiro";
  const bedLabel = bedConfig === "ONE_BED" ? "1 cama" : bedConfig === "EXTRA_BED" ? "2 camas + cama extra" : "2 camas";

  const handleProceed = () => {
    onProceed?.({
      startDate,
      endDate,
      period,
      bedConfig,
      totalPrice: (total / spots).toFixed(2),
      spots,
    });
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

        {/* Date range */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
          <div className="field-group">
            <label>Data de início</label>
            <input type="date" value={startDate} onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value > endDate) setEndDate(e.target.value);
            }} />
          </div>
          <div className="field-group">
            <label>Data de fim</label>
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        {/* Days indicator */}
        <div style={{ fontSize: "0.82rem", color: "#f97316", fontWeight: 600, textAlign: "center", background: "rgba(249,115,22,0.08)", borderRadius: 7, padding: "0.4rem" }}>
          {days} dia{days !== 1 ? "s" : ""}
          {startDate !== endDate ? ` (${startDate} → ${endDate})` : ""}
        </div>

        {/* Other inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
          <div className="field-group">
            <label>Nº de Chapéus</label>
            <input type="number" min={1} max={50} value={spots}
              onChange={(e) => setSpots(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <div className="field-group">
            <label>Modalidade</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="MORNING">Manhã (09h–14h)</option>
              <option value="AFTERNOON">Tarde (14h–19h)</option>
              <option value="FULL_DAY">Dia Inteiro</option>
            </select>
          </div>
          <div className="field-group">
            <label>Camas</label>
            <select value={baseBeds} onChange={(e) => {
              const b = e.target.value as "ONE_BED" | "TWO_BEDS";
              setBaseBeds(b);
              if (b === "ONE_BED") setExtraBed(false);
            }}>
              <option value="TWO_BEDS">2 camas</option>
              <option value="ONE_BED">1 cama (chapéu)</option>
            </select>
          </div>
          <div className="field-group">
            <label>Desconto</label>
            <select value={discount} onChange={(e) => setDiscount(e.target.value as Discount)}>
              <option value="none">Sem desconto</option>
              <option value="free_day" disabled={days < 7}>
                1 dia grátis / 7 dias {days < 7 ? "(mín. 7)" : ""}
              </option>
              <option value="ten_percent" disabled={days <= 7}>
                10% de desconto {days <= 7 ? "(mín. 8 dias)" : ""}
              </option>
            </select>
          </div>
        </div>

        {/* Extra bed toggle */}
        {baseBeds === "TWO_BEDS" && (
          <div className="toggle-row" style={{ marginTop: "-0.3rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#aaa" }}>+ Cama Extra (+{concession.priceExtraBed.toFixed(2)}€/dia)</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={extraBed} onChange={(e) => setExtraBed(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        )}

        {/* Breakdown */}
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, overflow: "hidden" }}>
          {[
            { label: `Preço base/dia (${periodLabel}, ${bedLabel})`, value: `${basePerDay.toFixed(2)}€` },
            { label: `× ${spots} chapéu${spots !== 1 ? "s" : ""}`, value: `${(basePerDay * spots).toFixed(2)}€` },
            { label: `× ${discount === "free_day" && freeDays > 0 ? `${billableDays} dias faturáveis (${freeDays} grátis)` : `${days} dias`}`, value: `${subtotal.toFixed(2)}€` },
          ].map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0.9rem", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.84rem" }}>
              <span style={{ color: "#888" }}>{row.label}</span>
              <span style={{ color: "#f1f1f1", fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
          {discountAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0.9rem", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.84rem" }}>
              <span style={{ color: "#22c55e" }}>{discount === "free_day" ? `${freeDays} dia${freeDays !== 1 ? "s" : ""} grátis` : "Desconto 10%"}</span>
              <span style={{ color: "#22c55e", fontWeight: 600 }}>−{discountAmount.toFixed(2)}€</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.9rem", background: "rgba(249,115,22,0.08)" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f1f1" }}>Total</span>
              {spots > 1 && <div style={{ fontSize: "0.75rem", color: "#888" }}>{(total / spots).toFixed(2)}€ por chapéu</div>}
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "#f97316" }}>{total.toFixed(2)}€</span>
          </div>
        </div>

        {/* Proceed button */}
        {onProceed && (
          <button className="action-btn success" onClick={handleProceed} style={{ marginTop: "0.2rem" }}>
            <ArrowRight size={15} /> Proceder com a Reserva
          </button>
        )}
      </div>
    </div>
  );
}
