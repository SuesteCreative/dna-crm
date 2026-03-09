"use client";
import { useEffect, useState, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/Skeleton";
import SpotPanel from "./SpotPanel";

interface Spot {
  id: string;
  spotNumber: number;
  row: number;
  col: number;
  isActive: boolean;
}

interface Concession {
  id: string;
  slug: string;
  name: string;
  rows: number;
  cols: number;
  priceFull: number;
  priceMorning: number;
  priceAfternoon: number;
  priceExtraBed: number;
  priceOneBed: number;
  spots: Spot[];
}

interface Entry {
  id: string;
  spotId: string;
  date: string;
  period: string;
  clientName: string;
  clientPhone?: string;
  bedConfig: string;
  totalPrice: number;
  isPaid: boolean;
  notes?: string;
  reservationId?: string;
  isCarryOver: boolean;
  status: string;
}

interface SpotState {
  spot: Spot;
  entries: Entry[];
}

function today() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

function spotStatus(entries: Entry[]): "free" | "morning" | "afternoon" | "full" | "split" | "reserved" {
  if (!entries.length) return "free";
  const active = entries.filter((e) => e.status === "ACTIVE" || e.status === "CARRIED_OVER");
  if (!active.length) return "free";
  const hasReservation = active.some((e) => e.reservationId);
  const periods = active.map((e) => e.period);
  if (periods.includes("FULL_DAY")) return hasReservation ? "reserved" : "full";
  const hasMorning = periods.includes("MORNING");
  const hasAfternoon = periods.includes("AFTERNOON");
  if (hasMorning && hasAfternoon) return "split";
  if (hasMorning) return hasReservation ? "reserved" : "morning";
  if (hasAfternoon) return hasReservation ? "reserved" : "afternoon";
  return "free";
}

function bedIcon(config: string) {
  if (config === "ONE_BED") return "🛏";
  if (config === "EXTRA_BED") return "🛏🛏🛏";
  return "🛏🛏";
}

export default function DailyControl({ concession }: { concession: Concession }) {
  const [date, setDate] = useState(today());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<SpotState | null>(null);
  const [exporting, setExporting] = useState(false);
  const noteKey = `daily-note:${concession.slug}:${date}`;
  const [dailyNote, setDailyNote] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(`daily-note:${concession.slug}:${new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" })}`) ?? "";
  });

  // Body scroll lock
  useEffect(() => {
    document.body.classList.toggle("modal-open", !!selectedSpot);
    return () => document.body.classList.remove("modal-open");
  }, [selectedSpot]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/concessions/${concession.slug}/entries?date=${date}`);
    const data = await res.json();
    const newEntries: Entry[] = Array.isArray(data) ? data : [];
    setEntries(newEntries);
    // Keep panel open with refreshed entries after any action
    setSelectedSpot((prev) =>
      prev ? { spot: prev.spot, entries: newEntries.filter((e) => e.spotId === prev.spot.id) } : null
    );
    setLoading(false);
  }, [concession.slug, date]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Load note from localStorage when date changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDailyNote(localStorage.getItem(noteKey) ?? "");
    }
  }, [noteKey]);

  // Build spot states
  const spotStates: SpotState[] = concession.spots.map((spot) => ({
    spot,
    entries: entries.filter((e) => e.spotId === spot.id),
  }));

  // Summary — count entries by period (not spots by status)
  const freeCount = spotStates.filter((s) => spotStatus(s.entries) === "free").length;
  const reservedCount = spotStates.filter((s) => spotStatus(s.entries) === "reserved").length;
  const morningCount = entries.filter((e) => e.period === "MORNING").length;
  const afternoonCount = entries.filter((e) => e.period === "AFTERNOON").length;
  const fullDayCount = entries.filter((e) => e.period === "FULL_DAY").length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/concessions/${concession.slug}/export?date=${date}&note=${encodeURIComponent(dailyNote)}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `controlo-${concession.slug}-${date}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {/* Date bar */}
      <div className="date-bar">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }} className="date-bar-actions">
          <button className="export-btn" onClick={fetchEntries} disabled={loading}>
            <RefreshCw size={14} className={loading ? "conc-spin" : ""} /> Atualizar
          </button>
          <button className="export-btn" onClick={handleExport} disabled={exporting}>
            <Download size={14} /> {exporting ? "..." : "Exportar"}
          </button>
        </div>
      </div>

      <div className="summary-chips">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} width={80} height={24} borderRadius={20} />)
        ) : (
          <>
            <span className="summary-chip free">{freeCount} livres</span>
            <span className="summary-chip morning">{morningCount} Manhã</span>
            <span className="summary-chip afternoon">{afternoonCount} Tarde</span>
            <span className="summary-chip full">{fullDayCount} Dia Inteiro</span>
            <span className="summary-chip reserved">{reservedCount} Reservas</span>
          </>
        )}
      </div>

      {/* Spot grid */}
      <div className="daily-control-scroll-wrap">
        <div
          className="spot-grid"
          style={{ gridTemplateColumns: `repeat(${concession.cols}, minmax(70px, 1fr))` }}
        >
          {loading ? (
            Array.from({ length: concession.spots.length }).map((_, i) => (
              <Skeleton key={i} height={76} borderRadius={8} style={{ border: "1.5px solid rgba(255,255,255,0.07)" }} />
            ))
          ) : (
            spotStates.map(({ spot, entries: spotEntries }) => {
              const status = spotStatus(spotEntries);
              const active = spotEntries.filter(e => e.status === "ACTIVE" || e.status === "CARRIED_OVER");
              const fullEnt = active.find(e => e.period === "FULL_DAY");
              const morningEnt = active.find(e => e.period === "MORNING");
              const afternoonEnt = active.find(e => e.period === "AFTERNOON");
              const primaryEntry = fullEnt || morningEnt || afternoonEnt;

              // Top half: prefer morning override over full-day
              const topEnt = morningEnt || fullEnt;
              const topColor = !topEnt ? "free"
                : topEnt.reservationId ? "reserved"
                  : topEnt.period === "FULL_DAY" ? "full" : "morning";

              // Bottom half: prefer afternoon override over full-day
              const botColor = afternoonEnt
                ? (afternoonEnt.reservationId ? "reserved" : "afternoon")
                : fullEnt ? (fullEnt.reservationId ? "reserved" : "full")
                  : "free";

              // Merged = pure full-day with no overrides (seamless halves)
              const isFullMerged = !!fullEnt && !morningEnt && !afternoonEnt;

              return (
                <div
                  key={spot.id}
                  className={`spot-cell ${status}`}
                  onClick={() => setSelectedSpot({ spot, entries: spotEntries })}
                  title={`Lugar ${spot.spotNumber}${primaryEntry ? " — " + primaryEntry.clientName : ""}`}
                >
                  <div className="spot-num-bar">{spot.spotNumber}</div>
                  <div className={`spot-halves${isFullMerged ? " merged" : ""}`}>
                    <div className={`spot-half ${topColor}`}>
                      {topEnt?.reservationId && <span className="spot-r-badge">R</span>}
                      {topEnt && <span className="spot-client-sm">{topEnt.clientName}</span>}
                      {topEnt && <span className="spot-bed-sm">{bedIcon(topEnt.bedConfig)}</span>}
                    </div>
                    <div className={`spot-half ${botColor}`}>
                      {afternoonEnt?.reservationId && <span className="spot-r-badge">R</span>}
                      {afternoonEnt && <span className="spot-client-sm">{afternoonEnt.clientName}</span>}
                      {afternoonEnt && <span className="spot-bed-sm">{bedIcon(afternoonEnt.bedConfig)}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Daily note */}
      <div className="daily-note-area">
        <div className="field-group" style={{ marginBottom: 0 }}>
          <label>Nota do dia</label>
          <textarea
            placeholder="Observações, incidentes ou notas para este dia..."
            value={dailyNote}
            onChange={(e) => {
              setDailyNote(e.target.value);
              if (typeof window !== "undefined") localStorage.setItem(noteKey, e.target.value);
            }}
            rows={2}
          />
        </div>
        <details className="daily-legend">
          <summary>Legenda &amp; ajuda</summary>
          <div className="daily-legend-body">
            <div className="legend-section">
              <strong>Cores dos lugares</strong>
              <div className="leg-colors">
                <div><span className="leg-dot free" /> Livre</div>
                <div><span className="leg-dot morning" /> Manhã (09h–14h)</div>
                <div><span className="leg-dot afternoon" /> Tarde (14h–19h)</div>
                <div><span className="leg-dot full" /> Dia Inteiro</div>
                <div><span className="leg-dot reserved" /> Reserva pré-existente</div>
                <div><span className="leg-dot split" /> Split (dois clientes)</div>
              </div>
              <strong style={{ marginTop: "0.8rem" }}>
                Badge <span style={{ color: "#ef4444" }}>R</span>
              </strong>
              <p style={{ fontSize: "0.8rem", color: "#aaa", margin: "0.2rem 0 0", lineHeight: 1.45 }}>
                Entrada proveniente de uma reserva prévia. Ver detalhes em <em>Reservas</em>.
              </p>
              <strong style={{ marginTop: "0.8rem" }}>
                ★ Carry-over
              </strong>
              <p style={{ fontSize: "0.8rem", color: "#aaa", margin: "0.2rem 0 0", lineHeight: 1.45 }}>
                Cliente pagou Dia Inteiro mas saiu cedo. A tarde é transferida para amanhã como <em>pré-pago</em>.
              </p>
            </div>
            <div className="legend-section">
              <strong>Ações no painel</strong>
              <ul className="leg-actions">
                <li><strong>Registar</strong> — walk-in para o período selecionado</li>
                <li><strong>Estender para Dia Inteiro</strong> — converte Manhã em Dia Inteiro (cobra diferença)</li>
                <li><strong>Libertar</strong> — cancela a entrada; lugar fica disponível</li>
                <li><strong>Re-alugar</strong> — substitui cliente no mesmo período (override)</li>
                <li><strong>Carry-over da Tarde</strong> — transfere tarde não usada para amanhã num spot à escolha</li>
              </ul>
            </div>
          </div>
        </details>
      </div>

      {/* Spot panel */}
      {selectedSpot && (
        <SpotPanel
          concession={concession}
          spotState={selectedSpot}
          date={date}
          onClose={() => setSelectedSpot(null)}
          onRefresh={fetchEntries}
        />
      )}
    </div>
  );
}
