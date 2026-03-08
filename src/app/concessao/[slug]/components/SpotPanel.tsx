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

function calcPrice(
  period: string,
  bedConfig: string,
  concession: Concession
): number {
  const base =
    period === "MORNING"
      ? concession.priceMorning
      : period === "AFTERNOON"
      ? concession.priceAfternoon
      : concession.priceFull;
  if (bedConfig === "ONE_BED") return concession.priceOneBed;
  if (bedConfig === "EXTRA_BED") return base + concession.priceExtraBed;
  return base;
}

function periodLabel(p: string) {
  return p === "MORNING" ? "Manhã" : p === "AFTERNOON" ? "Tarde" : "Dia Inteiro";
}

function bedLabel(b: string) {
  return b === "ONE_BED" ? "1 cama" : b === "EXTRA_BED" ? "3 camas (extra)" : "2 camas";
}

function nextDay(date: string) {
  const d = new Date(date + "T12:00:00Z");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function SpotPanel({ concession, spotState, date, onClose, onRefresh }: Props) {
  const { spot, entries } = spotState;
  const activeEntries = entries.filter((e) => e.status === "ACTIVE" || e.status === "CARRIED_OVER");
  const fullDayEntry = activeEntries.find((e) => e.period === "FULL_DAY");
  const morningEntry = activeEntries.find((e) => e.period === "MORNING");
  const afternoonEntry = activeEntries.find((e) => e.period === "AFTERNOON");
  const isFree = activeEntries.length === 0;

  // Form state for new entry
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  // Default period = the first free period for this spot
  const [period, setPeriod] = useState<string>(
    fullDayEntry ? "AFTERNOON"
    : !morningEntry ? "MORNING"
    : !afternoonEntry ? "AFTERNOON"
    : "FULL_DAY"
  );
  const [bedConfig, setBedConfig] = useState("TWO_BEDS");
  const [price, setPrice] = useState(() => {
    const defaultPeriod = fullDayEntry ? "AFTERNOON" : (!morningEntry ? "MORNING" : "AFTERNOON");
    return String(calcPrice(defaultPeriod, "TWO_BEDS", concession));
  });
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Add-second-period form toggle
  const [showAddForm, setShowAddForm] = useState(false);

  // Carry-over state
  const [showCarryOver, setShowCarryOver] = useState(false);
  const [coTargetSpot, setCoTargetSpot] = useState("");
  const [coBedConfig, setCoBedConfig] = useState("");
  const [coError, setCoError] = useState("");

  const tomorrow = nextDay(date);

  const updatePrice = (p: string, b: string) => {
    setPrice(String(calcPrice(p, b, concession)));
  };

  const handleRegister = async () => {
    if (!clientName.trim()) { setError("Nome do cliente obrigatório"); return; }
    setBusy(true); setError("");
    const res = await fetch(`/api/concessions/${concession.slug}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotId: spot.id,
        date,
        period,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || null,
        bedConfig,
        totalPrice: parseFloat(price),
        isPaid,
        notes: notes.trim() || null,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error || "Erro ao registar"); return; }
    onRefresh(); onClose();
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Confirmar libertação deste lugar?")) return;
    setBusy(true);
    await fetch(`/api/concessions/${concession.slug}/entries/${entryId}`, { method: "DELETE" });
    setBusy(false);
    onRefresh(); onClose();
  };

  const handleExtendToFull = async () => {
    if (!morningEntry) return;
    const diff = concession.priceFull - morningEntry.totalPrice;
    const newPrice = concession.priceFull;
    setBusy(true);
    // Delete morning + create full day
    await fetch(`/api/concessions/${concession.slug}/entries/${morningEntry.id}`, { method: "DELETE" });
    await fetch(`/api/concessions/${concession.slug}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spotId: spot.id,
        date,
        period: "FULL_DAY",
        clientName: morningEntry.clientName,
        clientPhone: morningEntry.clientPhone,
        bedConfig: morningEntry.bedConfig,
        totalPrice: newPrice,
        isPaid: morningEntry.isPaid,
        notes: morningEntry.notes,
      }),
    });
    setBusy(false);
    onRefresh(); onClose();
  };

  const handleCarryOver = async () => {
    if (!coTargetSpot) { setCoError("Selecionar lugar para amanhã"); return; }
    setBusy(true); setCoError("");
    const res = await fetch(
      `/api/concessions/${concession.slug}/entries/${fullDayEntry!.id}/carry-over`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSpotId: coTargetSpot, targetDate: tomorrow, bedConfig: coBedConfig || fullDayEntry!.bedConfig }),
      }
    );
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setCoError(data.error || "Erro no carry-over"); return; }
    setShowCarryOver(false);
    onRefresh(); onClose();
  };

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel-drawer">
        <div className="panel-head">
          <h3>Lugar {spot.spotNumber}</h3>
          <button className="panel-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="panel-body">
          {/* ── FREE spot ── */}
          {isFree && (
            <>
              <div className="field-group">
                <label>Nome do cliente *</label>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="field-group">
                <label>Telefone</label>
                <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+351 9xx xxx xxx" />
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Modalidade</label>
                  <select value={period} onChange={(e) => { setPeriod(e.target.value); updatePrice(e.target.value, bedConfig); }}>
                    <option value="MORNING">Manhã (09h–14h)</option>
                    <option value="AFTERNOON">Tarde (14h–19h)</option>
                    <option value="FULL_DAY">Dia Inteiro</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Camas</label>
                  <select value={bedConfig} onChange={(e) => { setBedConfig(e.target.value); updatePrice(period, e.target.value); }}>
                    <option value="TWO_BEDS">2 camas</option>
                    <option value="ONE_BED">1 cama (chapéu)</option>
                    <option value="EXTRA_BED">3 camas (extra)</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Preço (€)</label>
                  <input type="number" step="0.5" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div className="field-group" style={{ justifyContent: "flex-end" }}>
                  <label>Pago</label>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
              <div className="field-group">
                <label>Notas</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              {error && <p style={{ color: "#ef4444", fontSize: "0.82rem", margin: 0 }}>{error}</p>}
              <button className="action-btn primary" onClick={handleRegister} disabled={busy}>
                {busy ? <Loader2 size={14} className="conc-spin" /> : null} Registar
              </button>
            </>
          )}

          {/* ── MORNING only ── */}
          {!isFree && morningEntry && !afternoonEntry && !fullDayEntry && (
            <>
              <div style={{ fontSize: "0.72rem", color: "#fb923c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Manhã</div>
              <div className="info-row"><span className="label">Cliente</span><span className="value">{morningEntry.clientName}</span></div>
              {morningEntry.clientPhone && <div className="info-row"><span className="label">Telefone</span><span className="value">{morningEntry.clientPhone}</span></div>}
              <div className="info-row"><span className="label">Camas</span><span className="value">{bedLabel(morningEntry.bedConfig)}</span></div>
              <div className="info-row"><span className="label">Preço</span><span className="value">{morningEntry.totalPrice.toFixed(2)}€ {morningEntry.isPaid ? "✓ pago" : "— não pago"}</span></div>
              {morningEntry.notes && <div className="info-row"><span className="label">Notas</span><span className="value">{morningEntry.notes}</span></div>}
              <div className="action-divider" />
              <button className="action-btn warning" onClick={handleExtendToFull} disabled={busy}>
                Estender para Dia Inteiro (+{(concession.priceFull - morningEntry.totalPrice).toFixed(2)}€)
              </button>
              <button className="action-btn danger" onClick={() => handleDelete(morningEntry.id)} disabled={busy}>
                Libertar Manhã
              </button>
              <div className="action-divider" />
              {!showAddForm ? (
                <button className="action-btn blue" onClick={() => setShowAddForm(true)} disabled={busy}>
                  + Tarde livre — Registar cliente
                </button>
              ) : (
                <>
                  <div style={{ fontSize: "0.72rem", color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tarde — novo cliente</div>
                  <div className="field-group">
                    <label>Nome do cliente *</label>
                    <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="field-group">
                    <label>Telefone</label>
                    <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+351 9xx xxx xxx" />
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Camas</label>
                      <select value={bedConfig} onChange={(e) => { setBedConfig(e.target.value); updatePrice(period, e.target.value); }}>
                        <option value="TWO_BEDS">2 camas</option>
                        <option value="ONE_BED">1 cama (chapéu)</option>
                        <option value="EXTRA_BED">3 camas (extra)</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Preço (€)</label>
                      <input type="number" step="0.5" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                  </div>
                  <div className="toggle-row">
                    <span>Pago</span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  {error && <p style={{ color: "#ef4444", fontSize: "0.82rem", margin: 0 }}>{error}</p>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <button className="action-btn primary" onClick={handleRegister} disabled={busy}>
                      {busy ? <Loader2 size={14} className="conc-spin" /> : null} Registar Tarde
                    </button>
                    <button className="action-btn danger" onClick={() => setShowAddForm(false)} disabled={busy}>Cancelar</button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── AFTERNOON only ── */}
          {!isFree && afternoonEntry && !morningEntry && !fullDayEntry && (
            <>
              <div style={{ fontSize: "0.72rem", color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tarde</div>
              <div className="info-row"><span className="label">Cliente</span><span className="value">{afternoonEntry.clientName}</span></div>
              {afternoonEntry.clientPhone && <div className="info-row"><span className="label">Telefone</span><span className="value">{afternoonEntry.clientPhone}</span></div>}
              <div className="info-row"><span className="label">Camas</span><span className="value">{bedLabel(afternoonEntry.bedConfig)}</span></div>
              <div className="info-row"><span className="label">Preço</span><span className="value">{afternoonEntry.totalPrice.toFixed(2)}€ {afternoonEntry.isPaid ? "✓ pago" : "— não pago"}</span></div>
              <div className="action-divider" />
              <button className="action-btn danger" onClick={() => handleDelete(afternoonEntry.id)} disabled={busy}>
                Libertar Tarde
              </button>
              <div className="action-divider" />
              {!showAddForm ? (
                <button className="action-btn warning" onClick={() => setShowAddForm(true)} disabled={busy}>
                  + Manhã livre — Registar cliente
                </button>
              ) : (
                <>
                  <div style={{ fontSize: "0.72rem", color: "#fb923c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Manhã — novo cliente</div>
                  <div className="field-group">
                    <label>Nome do cliente *</label>
                    <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="field-group">
                    <label>Telefone</label>
                    <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+351 9xx xxx xxx" />
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Camas</label>
                      <select value={bedConfig} onChange={(e) => { setBedConfig(e.target.value); updatePrice(period, e.target.value); }}>
                        <option value="TWO_BEDS">2 camas</option>
                        <option value="ONE_BED">1 cama (chapéu)</option>
                        <option value="EXTRA_BED">3 camas (extra)</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Preço (€)</label>
                      <input type="number" step="0.5" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                  </div>
                  <div className="toggle-row">
                    <span>Pago</span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  {error && <p style={{ color: "#ef4444", fontSize: "0.82rem", margin: 0 }}>{error}</p>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <button className="action-btn primary" onClick={handleRegister} disabled={busy}>
                      {busy ? <Loader2 size={14} className="conc-spin" /> : null} Registar Manhã
                    </button>
                    <button className="action-btn danger" onClick={() => setShowAddForm(false)} disabled={busy}>Cancelar</button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── SPLIT (morning + afternoon) ── */}
          {!isFree && morningEntry && afternoonEntry && !fullDayEntry && (
            <>
              <div style={{ fontSize: "0.72rem", color: "#fb923c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Manhã</div>
              <div className="info-row"><span className="label">Cliente</span><span className="value">{morningEntry.clientName}</span></div>
              {morningEntry.clientPhone && <div className="info-row"><span className="label">Telefone</span><span className="value">{morningEntry.clientPhone}</span></div>}
              <div className="info-row"><span className="label">Camas</span><span className="value">{bedLabel(morningEntry.bedConfig)}</span></div>
              <div className="info-row"><span className="label">Preço</span><span className="value">{morningEntry.totalPrice.toFixed(2)}€ {morningEntry.isPaid ? "✓ pago" : "— não pago"}</span></div>
              <button className="action-btn danger" onClick={() => handleDelete(morningEntry.id)} disabled={busy}>Libertar Manhã</button>
              <div className="action-divider" />
              <div style={{ fontSize: "0.72rem", color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tarde</div>
              <div className="info-row"><span className="label">Cliente</span><span className="value">{afternoonEntry.clientName}</span></div>
              {afternoonEntry.clientPhone && <div className="info-row"><span className="label">Telefone</span><span className="value">{afternoonEntry.clientPhone}</span></div>}
              <div className="info-row"><span className="label">Camas</span><span className="value">{bedLabel(afternoonEntry.bedConfig)}</span></div>
              <div className="info-row"><span className="label">Preço</span><span className="value">{afternoonEntry.totalPrice.toFixed(2)}€ {afternoonEntry.isPaid ? "✓ pago" : "— não pago"}</span></div>
              <button className="action-btn blue" onClick={() => handleDelete(afternoonEntry.id)} disabled={busy}>Libertar Tarde</button>
            </>
          )}

          {/* ── FULL DAY ── */}
          {!isFree && fullDayEntry && !showCarryOver && (
            <>
              <div style={{ fontSize: "0.72rem", color: "#a855f7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Dia Inteiro</div>
              <div className="info-row"><span className="label">Cliente</span><span className="value">{fullDayEntry.clientName}</span></div>
              {fullDayEntry.clientPhone && <div className="info-row"><span className="label">Telefone</span><span className="value">{fullDayEntry.clientPhone}</span></div>}
              <div className="info-row"><span className="label">Camas</span><span className="value">{bedLabel(fullDayEntry.bedConfig)}{fullDayEntry.isCarryOver ? " (carry-over)" : ""}</span></div>
              <div className="info-row"><span className="label">Preço</span><span className="value">{fullDayEntry.totalPrice.toFixed(2)}€ {fullDayEntry.isPaid ? "✓ pago" : "— não pago"}</span></div>
              {fullDayEntry.notes && <div className="info-row"><span className="label">Notas</span><span className="value">{fullDayEntry.notes}</span></div>}
              <div className="action-divider" />
              <button className="action-btn warning" onClick={() => setShowCarryOver(true)} disabled={busy}>
                Carry-over da Tarde →
              </button>
              <button className="action-btn danger" onClick={() => handleDelete(fullDayEntry.id)} disabled={busy}>
                Libertar Tudo
              </button>

              {/* Afternoon section — client left early or second client */}
              <div className="action-divider" />
              {afternoonEntry ? (
                <>
                  <div style={{ fontSize: "0.72rem", color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tarde — outro cliente</div>
                  <div className="info-row"><span className="label">Cliente</span><span className="value">{afternoonEntry.clientName}</span></div>
                  {afternoonEntry.clientPhone && <div className="info-row"><span className="label">Telefone</span><span className="value">{afternoonEntry.clientPhone}</span></div>}
                  <div className="info-row"><span className="label">Camas</span><span className="value">{bedLabel(afternoonEntry.bedConfig)}</span></div>
                  <div className="info-row"><span className="label">Preço</span><span className="value">{afternoonEntry.totalPrice.toFixed(2)}€ {afternoonEntry.isPaid ? "✓ pago" : "— não pago"}</span></div>
                  <button className="action-btn blue" onClick={() => handleDelete(afternoonEntry.id)} disabled={busy}>Libertar Tarde</button>
                </>
              ) : !showAddForm ? (
                <button className="action-btn blue" onClick={() => setShowAddForm(true)} disabled={busy}>
                  + Tarde livre — Registar cliente
                </button>
              ) : (
                <>
                  <div style={{ fontSize: "0.72rem", color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tarde — novo cliente</div>
                  <div className="field-group">
                    <label>Nome do cliente *</label>
                    <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="field-group">
                    <label>Telefone</label>
                    <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+351 9xx xxx xxx" />
                  </div>
                  <div className="field-row">
                    <div className="field-group">
                      <label>Camas</label>
                      <select value={bedConfig} onChange={(e) => { setBedConfig(e.target.value); updatePrice(period, e.target.value); }}>
                        <option value="TWO_BEDS">2 camas</option>
                        <option value="ONE_BED">1 cama (chapéu)</option>
                        <option value="EXTRA_BED">3 camas (extra)</option>
                      </select>
                    </div>
                    <div className="field-group">
                      <label>Preço (€)</label>
                      <input type="number" step="0.5" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
                    </div>
                  </div>
                  <div className="toggle-row">
                    <span>Pago</span>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                  {error && <p style={{ color: "#ef4444", fontSize: "0.82rem", margin: 0 }}>{error}</p>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <button className="action-btn primary" onClick={handleRegister} disabled={busy}>
                      {busy ? <Loader2 size={14} className="conc-spin" /> : null} Registar Tarde
                    </button>
                    <button className="action-btn danger" onClick={() => setShowAddForm(false)} disabled={busy}>Cancelar</button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── CARRY-OVER modal ── */}
          {showCarryOver && fullDayEntry && (
            <>
              <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 8, padding: "0.8rem", fontSize: "0.84rem" }}>
                Cliente <strong>{fullDayEntry.clientName}</strong> pagou Dia Inteiro mas saiu cedo.<br />
                Transferir tarde para <strong>{tomorrow}</strong>?
              </div>
              <div className="field-group">
                <label>Lugar para amanhã ({tomorrow})</label>
                <select value={coTargetSpot} onChange={(e) => setCoTargetSpot(e.target.value)}>
                  <option value="">— selecionar —</option>
                  {concession.spots.map((s) => (
                    <option key={s.id} value={s.id}>Lugar {s.spotNumber}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label>Configuração de camas (amanhã)</label>
                <select value={coBedConfig || fullDayEntry.bedConfig} onChange={(e) => setCoBedConfig(e.target.value)}>
                  <option value="TWO_BEDS">2 camas</option>
                  <option value="ONE_BED">1 cama (chapéu)</option>
                  <option value="EXTRA_BED">3 camas (extra)</option>
                </select>
              </div>
              <div style={{ fontSize: "0.8rem", color: "#888" }}>
                Amanhã: Lugar {coTargetSpot ? concession.spots.find(s => s.id === coTargetSpot)?.spotNumber : "?"}, modalidade Manhã — considerado pré-pago.
              </div>
              {coError && <p style={{ color: "#ef4444", fontSize: "0.82rem", margin: 0 }}>{coError}</p>}
              <button className="action-btn success" onClick={handleCarryOver} disabled={busy}>
                {busy ? <Loader2 size={14} className="conc-spin" /> : null} Confirmar Carry-over
              </button>
              <button className="action-btn danger" onClick={() => setShowCarryOver(false)} disabled={busy}>Cancelar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
