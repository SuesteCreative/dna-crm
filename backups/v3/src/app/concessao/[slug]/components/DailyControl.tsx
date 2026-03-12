"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Download, RefreshCw, CloudOff, Lock, Unlock, CalendarRange } from "lucide-react";
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
  const [exportingRange, setExportingRange] = useState(false);
  const [dailyNote, setDailyNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [blockingAction, setBlockingAction] = useState(false);
  const [weather, setWeather] = useState<{
    temp: number; code: number;
    windSpeed: number; windDir: number;
    waveHeight: number | null; wavePeriod: number | null;
  } | null>(null);
  const noteSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setSelectedSpot((prev) =>
      prev ? { spot: prev.spot, entries: newEntries.filter((e) => e.spotId === prev.spot.id) } : null
    );
    setLoading(false);
  }, [concession.slug, date]);

  // Load note + block status from DB when date changes
  const fetchDayMeta = useCallback(async () => {
    const [noteRes, blockRes] = await Promise.all([
      fetch(`/api/concessions/${concession.slug}/daily-note?date=${date}`),
      fetch(`/api/concessions/${concession.slug}/blocks?date=${date}`),
    ]);
    const noteData = await noteRes.json();
    const blockData = await blockRes.json();
    setDailyNote(noteData.note ?? "");
    setIsBlocked(blockData.blocked ?? false);
    setBlockReason(blockData.reason ?? null);
  }, [concession.slug, date]);

  useEffect(() => { fetchEntries(); fetchDayMeta(); }, [fetchEntries, fetchDayMeta]);

  // Weather + Marine — Open-Meteo, Alvor coords, no API key
  useEffect(() => {
    Promise.all([
      fetch("https://api.open-meteo.com/v1/forecast?latitude=37.1266&longitude=-8.5968&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&timezone=Europe%2FLisbon&wind_speed_unit=ms").then((r) => r.json()),
      fetch("https://marine-api.open-meteo.com/v1/marine?latitude=37.1266&longitude=-8.5968&current=wave_height,wave_period").then((r) => r.json()),
    ])
      .then(([atmos, marine]) => setWeather({
        temp:       Math.round(atmos.current.temperature_2m),
        code:       atmos.current.weather_code,
        windSpeed:  Math.round(atmos.current.wind_speed_10m * 10) / 10,
        windDir:    Math.round(atmos.current.wind_direction_10m),
        waveHeight: marine.current?.wave_height != null ? Math.round(marine.current.wave_height * 10) / 10 : null,
        wavePeriod: marine.current?.wave_period != null ? Math.round(marine.current.wave_period) : null,
      }))
      .catch(() => {});
  }, []);

  const saveNote = useCallback(async (value: string) => {
    setNoteSaving(true);
    await fetch(`/api/concessions/${concession.slug}/daily-note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, note: value }),
    });
    setNoteSaving(false);
  }, [concession.slug, date]);

  const handleNoteChange = (value: string) => {
    setDailyNote(value);
    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(() => saveNote(value), 1000);
  };

  const toggleBlock = async () => {
    setBlockingAction(true);
    if (isBlocked) {
      await fetch(`/api/concessions/${concession.slug}/blocks?date=${date}`, { method: "DELETE" });
      setIsBlocked(false);
      setBlockReason(null);
    } else {
      const reason = prompt("Motivo do fecho (opcional):", "Mau tempo") ?? "";
      await fetch(`/api/concessions/${concession.slug}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, reason: reason || null }),
      });
      setIsBlocked(true);
      setBlockReason(reason || null);
    }
    setBlockingAction(false);
  };

  function weatherIcon(code: number) {
    if (code === 0) return "☀️";
    if (code <= 3) return "⛅";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 99) return "⛈️";
    return "🌤️";
  }

  function windDirLabel(deg: number) {
    const dirs = ["N","NE","E","SE","S","SO","O","NO"];
    return dirs[Math.round(deg / 45) % 8];
  }

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

  const handleExportRange = async () => {
    const from = prompt("Data início (AAAA-MM-DD):", date);
    if (!from) return;
    const to = prompt("Data fim (AAAA-MM-DD):", date);
    if (!to) return;
    setExportingRange(true);
    try {
      const res = await fetch(`/api/concessions/${concession.slug}/export-range?from=${from}&to=${to}`);
      if (!res.ok) { const d = await res.json(); alert(d.error ?? "Erro ao exportar"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${concession.slug}-${from}-${to}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingRange(false);
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
        {weather && (
          <div className="dc-weather">
            <span className="dc-weather-main">{weatherIcon(weather.code)} {weather.temp}°C</span>
            <span className="dc-weather-sep">·</span>
            <span className="dc-weather-item" title="Vento">
              💨 {weather.windSpeed} m/s {windDirLabel(weather.windDir)}
            </span>
            {weather.waveHeight != null && (
              <>
                <span className="dc-weather-sep">·</span>
                <span className="dc-weather-item" title="Ondulação">
                  🌊 {weather.waveHeight}m{weather.wavePeriod != null ? ` / ${weather.wavePeriod}s` : ""}
                </span>
              </>
            )}
          </div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }} className="date-bar-actions">
          <button
            className={`export-btn${isBlocked ? " dc-block-active" : ""}`}
            onClick={toggleBlock}
            disabled={blockingAction}
            title={isBlocked ? `Desblocar dia${blockReason ? ` (${blockReason})` : ""}` : "Bloquear dia (mau tempo / manutenção)"}
          >
            {isBlocked ? <Unlock size={14} /> : <Lock size={14} />}
            {isBlocked ? "Desblocar" : "Bloquear"}
          </button>
          <button className="export-btn" onClick={fetchEntries} disabled={loading}>
            <RefreshCw size={14} className={loading ? "conc-spin" : ""} /> Atualizar
          </button>
          <button className="export-btn" onClick={handleExport} disabled={exporting}>
            <Download size={14} /> {exporting ? "..." : "Exportar"}
          </button>
          <button className="export-btn" onClick={handleExportRange} disabled={exportingRange} title="Exportar relatório semanal/mensal">
            <CalendarRange size={14} /> {exportingRange ? "..." : "Relatório"}
          </button>
        </div>
      </div>

      {/* Blocked day banner */}
      {isBlocked && (
        <div className="dc-blocked-banner">
          <CloudOff size={16} />
          <span>Dia bloqueado{blockReason ? ` — ${blockReason}` : ""}. Novas entradas desativadas.</span>
        </div>
      )}

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
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Nota do dia
            {noteSaving && <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>A guardar...</span>}
          </label>
          <textarea
            placeholder="Observações, incidentes ou notas para este dia..."
            value={dailyNote}
            onChange={(e) => handleNoteChange(e.target.value)}
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
