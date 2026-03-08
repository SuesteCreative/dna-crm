"use client";
import { useEffect, useState, useCallback } from "react";
import { Download, RefreshCw } from "lucide-react";
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
  return new Date().toISOString().slice(0, 10);
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

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/concessions/${concession.slug}/entries?date=${date}`);
    const data = await res.json();
    setEntries(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [concession.slug, date]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Build spot states
  const spotStates: SpotState[] = concession.spots.map((spot) => ({
    spot,
    entries: entries.filter((e) => e.spotId === spot.id),
  }));

  // Summary
  const freeCount = spotStates.filter((s) => spotStatus(s.entries) === "free").length;
  const takenCount = spotStates.length - freeCount;
  const reservedCount = spotStates.filter((s) => spotStatus(s.entries) === "reserved").length;

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/concessions/${concession.slug}/export?date=${date}`);
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
        <div className="summary-chips">
          <span className="summary-chip free">{freeCount} livres</span>
          <span className="summary-chip morning">{spotStates.filter(s => spotStatus(s.entries) === "morning").length} Manhã</span>
          <span className="summary-chip afternoon">{spotStates.filter(s => spotStatus(s.entries) === "afternoon").length} Tarde</span>
          <span className="summary-chip full">{spotStates.filter(s => ["full","split"].includes(spotStatus(s.entries))).length} Dia Inteiro</span>
          <span className="summary-chip reserved">{reservedCount} Reservas</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
          <button className="export-btn" onClick={fetchEntries} disabled={loading}>
            <RefreshCw size={14} className={loading ? "conc-spin" : ""} /> Atualizar
          </button>
          <button className="export-btn" onClick={handleExport} disabled={exporting}>
            <Download size={14} /> {exporting ? "A exportar..." : "Exportar Dia"}
          </button>
        </div>
      </div>

      {/* Spot grid */}
      <div
        className="spot-grid"
        style={{ gridTemplateColumns: `repeat(${concession.cols}, minmax(70px, 1fr))` }}
      >
        {spotStates.map(({ spot, entries: spotEntries }) => {
          const status = spotStatus(spotEntries);
          const primaryEntry = spotEntries.find((e) =>
            e.status === "ACTIVE" || e.status === "CARRIED_OVER"
          );
          return (
            <div
              key={spot.id}
              className={`spot-cell ${status}`}
              onClick={() => setSelectedSpot({ spot, entries: spotEntries })}
              title={`Lugar ${spot.spotNumber}${primaryEntry ? " — " + primaryEntry.clientName : ""}`}
            >
              <span className="spot-num">{spot.spotNumber}</span>
              {status === "reserved" && <span className="spot-res-badge">R</span>}
              {primaryEntry && (
                <>
                  <span className="spot-client">{primaryEntry.clientName}</span>
                  <span className="spot-bed">{bedIcon(primaryEntry.bedConfig)}</span>
                </>
              )}
            </div>
          );
        })}
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
