"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface Spot {
  id: string;
  spotNumber: number;
  row: number;
  col: number;
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

interface Concession {
  id: string;
  slug: string;
  priceFull: number;
  priceMorning: number;
  priceAfternoon: number;
  priceExtraBed: number;
  priceOneBed: number;
  spots: Spot[];
}

interface SpotState {
  spot: Spot;
  entries: Entry[];
}

interface Props {
  concession: Concession;
  spotState: SpotState;
  date: string;
  onClose: () => void;
  onRefresh: () => void;
}

type FormMode =
  | null
  | "add-morning"
  | "add-afternoon"
  | "add-fullday"
  | "rerent-morning"
  | "rerent-afternoon";

function calcPrice(period: string, bedConfig: string, c: Concession): number {
  if (bedConfig === "ONE_BED") return c.priceOneBed;
  const base = period === "MORNING" ? c.priceMorning : period === "AFTERNOON" ? c.priceAfternoon : c.priceFull;
  return bedConfig === "EXTRA_BED" ? base + c.priceExtraBed : base;
}

function periodLabel(p: string) {
  return p === "MORNING" ? "Manhã" : p === "AFTERNOON" ? "Tarde" : "Dia Inteiro";
}

function bedLabel(b: string) {
  return b === "ONE_BED" ? "1 cama" : b === "EXTRA_BED" ? "2 camas + cama extra" : "2 camas";
}

function nextDay(date: string) {
  const d = new Date(date + "T12:00:00Z");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function modeToPeriod(mode: FormMode): string {
  if (mode === "add-morning" || mode === "rerent-morning") return "MORNING";
  if (mode === "add-afternoon" || mode === "rerent-afternoon") return "AFTERNOON";
  return "FULL_DAY";
}

export default function SpotPanel({ concession, spotState, date, onClose, onRefresh }: Props) {
  const { spot, entries } = spotState;
  const active = entries.filter((e) => e.status === "ACTIVE" || e.status === "CARRIED_OVER");
  const fullDayEntries = active.filter((e) => e.period === "FULL_DAY");
  const morningEntries = active.filter((e) => e.period === "MORNING");
  const afternoonEntries = active.filter((e) => e.period === "AFTERNOON");

  const morningOccupied = morningEntries.length > 0 || fullDayEntries.length > 0;
  const afternoonOccupied = afternoonEntries.length > 0 || fullDayEntries.length > 0;
  const bothFree = !morningOccupied && !afternoonOccupied;

  // Single shared form state
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [fClient, setFClient] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fBeds, setFBeds] = useState<"ONE_BED" | "TWO_BEDS">("TWO_BEDS");
  const [fExtraBed, setFExtraBed] = useState(false);
  const [fPrice, setFPrice] = useState("0");
  const [fPaid, setFPaid] = useState(true);
  const [fNotes, setFNotes] = useState("");
  const [fError, setFError] = useState("");
  const [busy, setBusy] = useState(false);

  // Carry-over state
  const [showCarryOver, setShowCarryOver] = useState(false);
  const [coSpot, setCoSpot] = useState("");
  const [coBeds, setCoBeds] = useState("");
  const [coError, setCoError] = useState("");

  const tomorrow = nextDay(date);

  function openForm(mode: FormMode) {
    const period = modeToPeriod(mode);
    setFormMode(mode);
    setFClient(""); setFPhone(""); setFBeds("TWO_BEDS"); setFExtraBed(false);
    setFPrice(String(calcPrice(period, "TWO_BEDS", concession)));
    setFPaid(true); setFNotes(""); setFError("");
  }

  async function handleSubmit() {
    if (!fClient.trim()) { setFError("Nome do cliente obrigatório"); return; }
    const period = modeToPeriod(formMode);
    const override = formMode === "rerent-morning" || formMode === "rerent-afternoon";
    const bedConfig = fBeds === "TWO_BEDS" && fExtraBed ? "EXTRA_BED" : fBeds;
    setBusy(true); setFError("");
    const res = await fetch(`/api/concessions/${concession.slug}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotId: spot.id, date, period,
        clientName: fClient.trim(), clientPhone: fPhone.trim() || null,
        bedConfig, totalPrice: parseFloat(fPrice), isPaid: fPaid,
        notes: fNotes.trim() || null, override,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setFError(data.message || data.error || "Erro ao registar"); return; }
    setFormMode(null);
    onRefresh();
  }

  async function handleDelete(entryId: string) {
    if (!confirm("Confirmar libertação deste registo?")) return;
    setBusy(true);
    await fetch(`/api/concessions/${concession.slug}/entries/${entryId}`, { method: "DELETE" });
    setBusy(false);
    onRefresh();
  }

  async function handleExtendToFull(morningEntry: Entry) {
    // Extension cost = standard delta (priceFull - priceMorning), regardless of any discount on morning
    const extensionCost = concession.priceFull - concession.priceMorning;
    const newTotal = morningEntry.totalPrice + extensionCost;
    setBusy(true);
    await fetch(`/api/concessions/${concession.slug}/entries/${morningEntry.id}`, { method: "DELETE" });
    await fetch(`/api/concessions/${concession.slug}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotId: spot.id, date, period: "FULL_DAY",
        clientName: morningEntry.clientName, clientPhone: morningEntry.clientPhone,
        bedConfig: morningEntry.bedConfig, totalPrice: newTotal,
        isPaid: morningEntry.isPaid, notes: morningEntry.notes,
      }),
    });
    setBusy(false);
    onRefresh();
  }

  async function handleCarryOver() {
    if (!coSpot) { setCoError("Selecionar lugar para amanhã"); return; }
    const fd = fullDayEntries[0];
    if (!fd) return;
    setBusy(true); setCoError("");
    const res = await fetch(`/api/concessions/${concession.slug}/entries/${fd.id}/carry-over`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetSpotId: coSpot, targetDate: tomorrow, bedConfig: coBeds || fd.bedConfig }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setCoError(data.error || "Erro no carry-over"); return; }
    setShowCarryOver(false);
    onRefresh();
  }

  // ── Render helpers (plain functions, not components) ──────────────────────

  function renderEntryCard(entry: Entry, accentColor: string, deleteLabel = "Libertar") {
    return (
      <div key={entry.id} className="entry-card" style={{ borderLeftColor: accentColor }}>
        <div className="info-row">
          <span className="label">Cliente</span>
          <span className="value">
            {entry.clientName}
            {entry.isCarryOver && <span style={{ color: "#eab308", fontSize: "0.75rem" }}> ★ carry-over</span>}
            {entry.reservationId && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}> 🔖</span>}
          </span>
        </div>
        {entry.clientPhone && (
          <div className="info-row"><span className="label">Telefone</span><span className="value">{entry.clientPhone}</span></div>
        )}
        <div className="info-row"><span className="label">Camas</span><span className="value">{bedLabel(entry.bedConfig)}</span></div>
        <div className="info-row">
          <span className="label">Preço</span>
          <span className="value">{entry.totalPrice.toFixed(2)}€ {entry.isPaid ? "✓ pago" : "✗ não pago"}</span>
        </div>
        {entry.notes && <div className="info-row"><span className="label">Notas</span><span className="value">{entry.notes}</span></div>}
        <button className="action-btn danger sm" onClick={() => handleDelete(entry.id)} disabled={busy}>
          {deleteLabel}
        </button>
      </div>
    );
  }

  function renderInlineForm() {
    if (!formMode) return null;
    const period = modeToPeriod(formMode);
    const isRerent = formMode.startsWith("rerent");
    const label = isRerent
      ? (formMode === "rerent-morning" ? "Re-alugar · Manhã" : "Re-alugar · Tarde")
      : (formMode === "add-morning" ? "Novo cliente · Manhã" : formMode === "add-afternoon" ? "Novo cliente · Tarde" : "Novo cliente · Dia Inteiro");
    return (
      <div className="slot-form">
        <div className="slot-form-label">{label}</div>
        <div className="field-group">
          <label>Nome *</label>
          <input value={fClient} onChange={(e) => setFClient(e.target.value)} placeholder="Nome completo" />
        </div>
        <div className="field-group">
          <label>Telefone</label>
          <input value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="+351 9xx xxx xxx" />
        </div>
        <div className="field-row">
          <div className="field-group">
            <label>Camas</label>
            <select value={fBeds} onChange={(e) => {
              const b = e.target.value as "ONE_BED" | "TWO_BEDS";
              setFBeds(b);
              setFExtraBed(false);
              setFPrice(String(calcPrice(period, b, concession)));
            }}>
              <option value="TWO_BEDS">2 camas</option>
              <option value="ONE_BED">1 cama (chapéu)</option>
            </select>
          </div>
          <div className="field-group">
            <label>Preço (€)</label>
            <input type="number" step="0.5" min="0" value={fPrice} onChange={(e) => setFPrice(e.target.value)} />
          </div>
        </div>
        {fBeds === "TWO_BEDS" && (
          <div className="toggle-row">
            <span>+ Cama Extra (+{concession.priceExtraBed.toFixed(2)}€)</span>
            <label className="toggle-switch">
              <input type="checkbox" checked={fExtraBed} onChange={(e) => {
                setFExtraBed(e.target.checked);
                const newBedConfig = e.target.checked ? "EXTRA_BED" : "TWO_BEDS";
                setFPrice(String(calcPrice(period, newBedConfig, concession)));
              }} />
              <span className="toggle-slider" />
            </label>
          </div>
        )}
        <div className="toggle-row">
          <span>Pago</span>
          <label className="toggle-switch">
            <input type="checkbox" checked={fPaid} onChange={(e) => setFPaid(e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="field-group">
          <label>Notas</label>
          <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={2} />
        </div>
        {fError && <p className="form-error">{fError}</p>}
        <div className="btn-row-2">
          <button className="action-btn primary" onClick={handleSubmit} disabled={busy}>
            {busy ? <Loader2 size={14} className="conc-spin" /> : null} Registar
          </button>
          <button className="action-btn ghost" onClick={() => setFormMode(null)} disabled={busy}>Cancelar</button>
        </div>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel-drawer">
        <div className="panel-head">
          <h3>Lugar {spot.spotNumber} <span style={{ fontWeight: 400, color: "#888", fontSize: "0.85rem" }}>— {date}</span></h3>
          <button className="panel-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="panel-body">

          {/* ══ CARRY-OVER MODAL ══ */}
          {showCarryOver && fullDayEntries.length > 0 && (
            <>
              <div className="carryover-box">
                Cliente <strong>{fullDayEntries[0].clientName}</strong> pagou Dia Inteiro mas saiu cedo.<br />
                Transferir tarde para <strong>{tomorrow}</strong>?
              </div>
              <div className="field-group">
                <label>Lugar para amanhã ({tomorrow})</label>
                <select value={coSpot} onChange={(e) => setCoSpot(e.target.value)}>
                  <option value="">— selecionar —</option>
                  {concession.spots.map((s) => (
                    <option key={s.id} value={s.id}>Lugar {s.spotNumber}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Camas (amanhã)</label>
                <select value={coBeds || fullDayEntries[0].bedConfig} onChange={(e) => setCoBeds(e.target.value)}>
                  <option value="TWO_BEDS">2 camas</option>
                  <option value="ONE_BED">1 cama (chapéu)</option>
                  <option value="EXTRA_BED">3 camas (extra)</option>
                </select>
              </div>
              {coError && <p className="form-error">{coError}</p>}
              <div className="btn-row-2">
                <button className="action-btn success" onClick={handleCarryOver} disabled={busy}>
                  {busy ? <Loader2 size={14} className="conc-spin" /> : null} Confirmar
                </button>
                <button className="action-btn ghost" onClick={() => setShowCarryOver(false)} disabled={busy}>Cancelar</button>
              </div>
            </>
          )}

          {/* ══ MAIN PANEL (hidden during carry-over) ══ */}
          {!showCarryOver && (
            <>

              {/* ── BOTH FREE ── */}
              {bothFree && (
                formMode ? renderInlineForm() : (
                  <div className="slot-free-all">
                    <p className="slot-free-hint">Lugar livre — escolher modalidade</p>
                    <div className="slot-free-btns">
                      <button className="action-btn morning-btn" onClick={() => openForm("add-morning")}>+ Manhã</button>
                      <button className="action-btn afternoon-btn" onClick={() => openForm("add-afternoon")}>+ Tarde</button>
                      <button className="action-btn full-btn" onClick={() => openForm("add-fullday")}>+ Dia Inteiro</button>
                    </div>
                  </div>
                )
              )}

              {/* ── SLOT SECTIONS ── */}
              {!bothFree && (
                <>

                  {/* ─ MANHÃ ─ */}
                  <div className="slot-section">
                    <div className="slot-section-header morning">
                      <span>Manhã · 09h–14h</span>
                      {morningOccupied && formMode !== "rerent-morning" && (
                        <button className="rerent-btn" onClick={() => openForm("rerent-morning")} disabled={busy}>
                          ↺ Re-alugar
                        </button>
                      )}
                    </div>
                    <div className="slot-section-body">
                      {/* Morning-specific entries */}
                      {morningEntries.map((e) => renderEntryCard(e, "#fb923c"))}

                      {/* Extend to Full Day (only when one morning entry, nothing else) */}
                      {morningEntries.length === 1 && afternoonEntries.length === 0 && fullDayEntries.length === 0 && (
                        <button className="action-btn warning sm" onClick={() => handleExtendToFull(morningEntries[0])} disabled={busy}>
                          → Dia Inteiro (+{(concession.priceFull - concession.priceMorning).toFixed(2)}€)
                        </button>
                      )}

                      {/* Add morning when slot is free */}
                      {!morningOccupied && (
                        formMode === "add-morning"
                          ? renderInlineForm()
                          : <button className="action-btn morning-btn sm" onClick={() => openForm("add-morning")} disabled={busy}>+ Registar Manhã</button>
                      )}

                      {/* Re-rent form */}
                      {formMode === "rerent-morning" && renderInlineForm()}
                    </div>
                  </div>

                  {/* ─ DIA INTEIRO ─ */}
                  {fullDayEntries.length > 0 && (
                    <div className="slot-section">
                      <div className="slot-section-header full">
                        <span>Dia Inteiro</span>
                      </div>
                      <div className="slot-section-body">
                        {fullDayEntries.map((e) => renderEntryCard(e, "#a855f7", "Libertar Dia Inteiro"))}
                        {!fullDayEntries[0]?.isCarryOver && (
                          <button className="action-btn warning sm" onClick={() => setShowCarryOver(true)} disabled={busy}>
                            Carry-over da Tarde →
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─ TARDE ─ */}
                  <div className="slot-section">
                    <div className="slot-section-header afternoon">
                      <span>Tarde · 14h–19h</span>
                      {afternoonOccupied && formMode !== "rerent-afternoon" && (
                        <button className="rerent-btn" onClick={() => openForm("rerent-afternoon")} disabled={busy}>
                          ↺ Re-alugar
                        </button>
                      )}
                    </div>
                    <div className="slot-section-body">
                      {/* Afternoon-specific entries */}
                      {afternoonEntries.map((e) => renderEntryCard(e, "#3b82f6"))}

                      {/* Add afternoon when slot is free */}
                      {!afternoonOccupied && (
                        formMode === "add-afternoon"
                          ? renderInlineForm()
                          : <button className="action-btn afternoon-btn sm" onClick={() => openForm("add-afternoon")} disabled={busy}>+ Registar Tarde</button>
                      )}

                      {/* Re-rent form */}
                      {formMode === "rerent-afternoon" && renderInlineForm()}
                    </div>
                  </div>

                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
