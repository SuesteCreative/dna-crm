"use client";
import { useState, useMemo } from "react";

interface Concession {
  priceFull: number;
  priceMorning: number;
  priceAfternoon: number;
  priceExtraBed: number;
  priceOneBed: number;
}

type Discount = "none" | "free_day" | "ten_percent";

export default function Calculator({ concession }: { concession: Concession }) {
  const [spots, setSpots] = useState(1);
  const [days, setDays] = useState(1);
  const [period, setPeriod] = useState("FULL_DAY");
  const [bedConfig, setBedConfig] = useState("TWO_BEDS");
  const [discount, setDiscount] = useState<Discount>("none");

  const { basePerDay, subtotal, discountAmount, total, freeDays, billableDays } = useMemo(() => {
    const periodPrice =
      period === "MORNING" ? concession.priceMorning :
      period === "AFTERNOON" ? concession.priceAfternoon :
      concession.priceFull;
    const basePerDay =
      bedConfig === "ONE_BED" ? concession.priceOneBed :
      bedConfig === "EXTRA_BED" ? periodPrice + concession.priceExtraBed :
      periodPrice;
    const subtotal = basePerDay * spots * days;
    let discountAmount = 0;
    let freeDays = 0;
    let billableDays = days;
    if (discount === "free_day" && days >= 7) {
      freeDays = Math.floor(days / 7);
      billableDays = days - freeDays;
      const discounted = basePerDay * spots * billableDays;
      discountAmount = subtotal - discounted;
    } else if (discount === "ten_percent" && days > 7) {
      discountAmount = subtotal * 0.1;
    }
    return { basePerDay, subtotal, discountAmount, total: subtotal - discountAmount, freeDays, billableDays };
  }, [spots, days, period, bedConfig, discount, concession]);

  const periodLabel = period === "MORNING" ? "Manhã" : period === "AFTERNOON" ? "Tarde" : "Dia Inteiro";
  const bedLabel = bedConfig === "ONE_BED" ? "1 cama" : bedConfig === "EXTRA_BED" ? "3 camas (extra)" : "2 camas";

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: "1.4rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}>
        {/* Inputs */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
          <div className="field-group">
            <label>Nº de lugares</label>
            <input
              type="number" min={1} max={50} value={spots}
              onChange={(e) => setSpots(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="field-group">
            <label>Nº de dias</label>
            <input
              type="number" min={1} max={180} value={days}
              onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
            />
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
            <select value={bedConfig} onChange={(e) => setBedConfig(e.target.value)}>
              <option value="TWO_BEDS">2 camas</option>
              <option value="ONE_BED">1 cama (chapéu)</option>
              <option value="EXTRA_BED">3 camas (extra)</option>
            </select>
          </div>
        </div>

        {/* Discount */}
        <div className="field-group">
          <label>Desconto</label>
          <select value={discount} onChange={(e) => setDiscount(e.target.value as Discount)}>
            <option value="none">Sem desconto</option>
            <option value="free_day" disabled={days < 7}>
              1 dia grátis por cada 7 dias {days < 7 ? "(mín. 7 dias)" : ""}
            </option>
            <option value="ten_percent" disabled={days <= 7}>
              10% de desconto {days <= 7 ? "(mín. 8 dias)" : ""}
            </option>
          </select>
        </div>

        {/* Result breakdown */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10,
          overflow: "hidden",
        }}>
          {[
            { label: `Preço base/dia (${periodLabel}, ${bedLabel})`, value: `${basePerDay.toFixed(2)}€` },
            { label: `× ${spots} lugar${spots !== 1 ? "es" : ""}`, value: `${(basePerDay * spots).toFixed(2)}€` },
            { label: `× ${discount === "free_day" && freeDays > 0 ? `${billableDays} dias faturáveis (${freeDays} grátis)` : `${days} dias`}`, value: `${subtotal.toFixed(2)}€` },
          ].map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.55rem 0.9rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: "0.84rem",
            }}>
              <span style={{ color: "#888" }}>{row.label}</span>
              <span style={{ color: "#f1f1f1", fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}

          {discountAmount > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.55rem 0.9rem",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              fontSize: "0.84rem",
            }}>
              <span style={{ color: "#22c55e" }}>
                {discount === "free_day" ? `${freeDays} dia${freeDays !== 1 ? "s" : ""} grátis` : "Desconto 10%"}
              </span>
              <span style={{ color: "#22c55e", fontWeight: 600 }}>−{discountAmount.toFixed(2)}€</span>
            </div>
          )}

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "0.9rem",
            background: "rgba(249,115,22,0.08)",
          }}>
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f1f1" }}>Total</span>
            <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "#f97316" }}>{total.toFixed(2)}€</span>
          </div>
        </div>
      </div>
    </div>
  );
}
