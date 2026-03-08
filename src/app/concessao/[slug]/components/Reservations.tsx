"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, X, Download, Loader2, Edit2, Trash2, List, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

interface Spot { id: string; spotNumber: number; }

interface Concession {
  id: string; slug: string;
  priceFull: number; priceMorning: number; priceAfternoon: number;
  priceExtraBed: number; priceOneBed: number;
  spots: Spot[];
}

interface Reservation {
  id: string; clientName: string; clientPhone?: string; clientEmail?: string;
  startDate: string; endDate: string; period: string; bedConfig: string;
  totalPrice: number; isPaid: boolean; notes?: string; status: string;
  spot: Spot; createdAt: string;
}

export interface ReservationInitData {
  startDate?: string; endDate?: string; period?: string; bedConfig?: string;
  totalPrice?: string; spots?: number;
}

function calcDays(start: string, end: string) {
  const s = new Date(start + "T12:00:00Z"), e = new Date(end + "T12:00:00Z");
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}
function periodLabel(p: string) { return p === "MORNING" ? "Manhã" : p === "AFTERNOON" ? "Tarde" : "Dia Inteiro"; }
function bedLabel(b: string) { return b === "ONE_BED" ? "1 cama" : b === "EXTRA_BED" ? "2 camas + cama extra" : "2 camas"; }
function calcPrice(period: string, bedConfig: string, days: number, c: Concession) {
  const base = period === "MORNING" ? c.priceMorning : period === "AFTERNOON" ? c.priceAfternoon : c.priceFull;
  const daily = bedConfig === "ONE_BED" ? c.priceOneBed : bedConfig === "EXTRA_BED" ? base + c.priceExtraBed : base;
  return daily * days;
}
function today() { return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" }); }

// ── Calendar helpers ────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDow(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun
}
function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function reservationsOnDay(reservations: Reservation[], dateStr: string) {
  return reservations.filter(
    (r) => r.status === "ACTIVE" && r.startDate <= dateStr && r.endDate >= dateStr
  );
}

const MONTH_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DOW_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

// ── Calendar sub-component ──────────────────────────────────
function CalendarView({ reservations }: { reservations: Reservation[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const todayStr = today();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDow(year, month); // 0=Sun; shift so Mon=0
  const offset = (firstDow + 6) % 7; // Mon-first offset

  const selectedRes = selected ? reservationsOnDay(reservations, selected) : [];

  return (
    <div className="res-cal">
      <div className="res-cal-nav">
        <button onClick={prevMonth}><ChevronLeft size={14} /></button>
        <h3>{MONTH_PT[month]} {year}</h3>
        <button onClick={nextMonth}><ChevronRight size={14} /></button>
      </div>
      <div className="res-cal-grid">
        {DOW_PT.map((d) => <div key={d} className="res-cal-dow">{d}</div>)}
        {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className="res-cal-day empty" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = isoDate(year, month, day);
          const dayRes = reservationsOnDay(reservations, dateStr);
          const isToday = dateStr === todayStr;
          const isSel = dateStr === selected;
          return (
            <div
              key={day}
              className={`res-cal-day${isToday ? " today" : ""}${isSel ? " selected" : ""}`}
              onClick={() => setSelected(isSel ? null : dateStr)}
            >
              <div className="res-cal-dn">{day}</div>
              <div className="res-cal-dots">
                {dayRes.slice(0, 6).map((r) => (
                  <div key={r.id} className="res-cal-dot" title={`L${r.spot.spotNumber} — ${r.clientName}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="res-cal-detail">
          <div style={{ fontSize: "0.82rem", color: "#888", marginBottom: "0.6rem" }}>
            {selected} — {selectedRes.length === 0 ? "Sem reservas activas" : `${selectedRes.length} reserva(s)`}
          </div>
          {selectedRes.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: "0.8rem", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.84rem" }}>
              <span style={{ fontWeight: 700, color: "#ef4444", minWidth: 28 }}>L{r.spot.spotNumber}</span>
              <span style={{ flex: 1, color: "#f1f1f1" }}>{r.clientName}</span>
              <span style={{ color: "#888" }}>{periodLabel(r.period)}</span>
              <span style={{ color: r.isPaid ? "#22c55e" : "#ef4444" }}>{r.isPaid ? "✓ pago" : "✗ não pago"}</span>
              <span style={{ color: "#888" }}>{r.startDate} → {r.endDate}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────
interface Props {
  concession: Concession;
  initialReservation?: ReservationInitData | null;
  onInitHandled?: () => void;
}

export default function Reservations({ concession, initialReservation, onInitHandled }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [filterSearch, setFilterSearch] = useState("");

  const emptyForm = () => ({
    clientName: "", clientPhone: "", clientEmail: "",
    spotId: concession.spots[0]?.id ?? "", startDate: today(), endDate: today(),
    period: "FULL_DAY", bedConfig: "TWO_BEDS",
    totalPrice: String(concession.priceFull), isPaid: false, notes: "",
  });

  const [form, setForm] = useState(emptyForm);
  // Extra spot IDs when booking multiple spots at once (from Calculator)
  const [extraSpotIds, setExtraSpotIds] = useState<string[]>([]);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [conflictDates, setConflictDates] = useState<string[]>([]);
  const [conflictAlts, setConflictAlts] = useState<{ spotId: string; spotNumber: number; blockedDates: string[] }[] | null>(null);
  const [blockedSpotIds, setBlockedSpotIds] = useState<Set<string>>(new Set());
  // Prevent auto-calc from overriding a price explicitly set by Calculator
  const skipAutoCalcRef = useRef(false);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterSearch) params.set("search", filterSearch);
    const res = await fetch(`/api/concessions/${concession.slug}/reservations?${params}`);
    const data = await res.json();
    setReservations(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [concession.slug, filterStatus, filterSearch]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  // Handle pre-fill from Calculator "Proceed" button
  useEffect(() => {
    if (!initialReservation) return;
    // If Calculator provides a price, skip the next auto-calc so it isn't overridden
    if (initialReservation.totalPrice != null) skipAutoCalcRef.current = true;
    setForm((prev) => ({
      ...emptyForm(),
      startDate: initialReservation.startDate ?? prev.startDate,
      endDate: initialReservation.endDate ?? prev.endDate,
      period: initialReservation.period ?? prev.period,
      bedConfig: initialReservation.bedConfig ?? prev.bedConfig,
      totalPrice: initialReservation.totalPrice ?? prev.totalPrice,
    }));
    // Pre-create extra spot selectors for multi-spot bookings
    const extraCount = Math.max(0, (initialReservation.spots ?? 1) - 1);
    setExtraSpotIds(Array(extraCount).fill(""));
    setEditing(null);
    setFormError("");
    setShowDrawer(true);
    onInitHandled?.();
  }, [initialReservation]);

  // Auto-calc price when form fields change, unless price was set by Calculator
  useEffect(() => {
    if (skipAutoCalcRef.current) { skipAutoCalcRef.current = false; return; }
    if (!form.startDate || !form.endDate || !form.period || !form.bedConfig) return;
    const days = calcDays(form.startDate, form.endDate);
    const price = calcPrice(form.period, form.bedConfig, days, concession);
    setForm((prev) => ({ ...prev, totalPrice: String(price.toFixed(2)) }));
  }, [form.startDate, form.endDate, form.period, form.bedConfig, concession]);

  // Fetch blocked spots whenever date range or period changes (for the drawer form)
  useEffect(() => {
    if (!showDrawer || !form.startDate || !form.endDate || !form.period) return;
    const params = new URLSearchParams({ start: form.startDate, end: form.endDate, period: form.period });
    if (editing) params.set("excludeReservationId", editing.id);
    fetch(`/api/concessions/${concession.slug}/availability?${params}`)
      .then((r) => r.json())
      .then((data) => setBlockedSpotIds(new Set(data.blockedSpotIds ?? [])))
      .catch(() => setBlockedSpotIds(new Set()));
  }, [showDrawer, form.startDate, form.endDate, form.period, editing, concession.slug]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setExtraSpotIds([]);
    setFormError(""); setConflictAlts(null); setConflictDates([]); setBlockedSpotIds(new Set());
    setShowDrawer(true);
  };

  const openEdit = (r: Reservation) => {
    setEditing(r);
    setForm({
      clientName: r.clientName, clientPhone: r.clientPhone ?? "", clientEmail: r.clientEmail ?? "",
      spotId: r.spot.id, startDate: r.startDate, endDate: r.endDate,
      period: r.period, bedConfig: r.bedConfig,
      totalPrice: String(r.totalPrice), isPaid: r.isPaid, notes: r.notes ?? "",
    });
    setFormError(""); setConflictAlts(null); setConflictDates([]); setBlockedSpotIds(new Set());
    setShowDrawer(true);
  };

  const handleSubmit = async () => {
    if (!form.clientName.trim()) { setFormError("Nome do cliente obrigatório"); return; }
    if (!form.spotId) { setFormError("Selecionar lugar"); return; }
    setFormBusy(true); setFormError("");

    // Pre-validate ALL spots before creating any reservation (Bug 5: avoid partial bookings)
    const filledExtras = extraSpotIds.filter(Boolean);
    if (!editing && filledExtras.length > 0) {
      const availParams = new URLSearchParams({ start: form.startDate, end: form.endDate, period: form.period });
      const availRes = await fetch(`/api/concessions/${concession.slug}/availability?${availParams}`);
      const availData = await availRes.json();
      const blocked = new Set<string>(availData.blockedSpotIds ?? []);
      const unavailableSpots = [form.spotId, ...filledExtras].filter((id) => blocked.has(id));
      if (unavailableSpots.length > 0) {
        const nums = unavailableSpots
          .map((id) => { const s = concession.spots.find((sp) => sp.id === id); return s ? `Lugar ${s.spotNumber}` : id; })
          .join(", ");
        setFormBusy(false);
        setFormError(`Lugares indisponíveis para este período: ${nums}`);
        return;
      }
    }

    const url = editing
      ? `/api/concessions/${concession.slug}/reservations/${editing.id}`
      : `/api/concessions/${concession.slug}/reservations`;
    const res = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, totalPrice: parseFloat(form.totalPrice) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormBusy(false);
      if (res.status === 409 && data.alternatives) {
        setConflictDates(data.conflictDates ?? []);
        setConflictAlts(data.alternatives);
        setFormError(data.message || "Conflito de disponibilidade");
      } else {
        setFormError(data.error || "Erro ao guardar");
        setConflictAlts(null);
      }
      return;
    }
    // Create additional reservations for extra spots (all pre-validated above)
    for (const spotId of filledExtras) {
      const extraRes = await fetch(`/api/concessions/${concession.slug}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, spotId, totalPrice: parseFloat(form.totalPrice) }),
      });
      if (!extraRes.ok) {
        const extraData = await extraRes.json();
        setFormBusy(false);
        setFormError(`Erro ao criar reserva extra: ${extraData.message || extraData.error || "erro desconhecido"}`);
        fetchReservations(); // show what was created so far
        return;
      }
    }
    setFormBusy(false);
    setConflictAlts(null);
    setConflictDates([]);
    setExtraSpotIds([]);
    setShowDrawer(false);
    fetchReservations();
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancelar reserva? As entradas futuras serão libertadas.")) return;
    await fetch(`/api/concessions/${concession.slug}/reservations/${id}`, { method: "DELETE" });
    fetchReservations();
  };

  const handleExportExcel = () => {
    const rows = reservations.map((r) => ({
      Cliente: r.clientName, Telefone: r.clientPhone ?? "", Email: r.clientEmail ?? "",
      Lugar: r.spot.spotNumber, "Data Início": r.startDate, "Data Fim": r.endDate,
      Dias: calcDays(r.startDate, r.endDate), Modalidade: periodLabel(r.period),
      Camas: bedLabel(r.bedConfig), "Total (€)": r.totalPrice.toFixed(2),
      Pago: r.isPaid ? "Sim" : "Não", Estado: r.status, Notas: r.notes ?? "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Reservas");
    XLSX.writeFile(wb, `reservas-${concession.slug}.xlsx`);
  };

  const active = reservations.filter((r) => r.status === "ACTIVE");
  const unpaid = active.filter((r) => !r.isPaid);
  const revenue = active.reduce((s, r) => s + r.totalPrice, 0);
  const tomorrowStr = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); })();
  const upcoming = active.filter((r) => r.startDate >= today() && r.startDate <= tomorrowStr);

  const filtered = reservations.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      return r.clientName.toLowerCase().includes(q) || r.spot.spotNumber.toString().includes(q) || (r.clientPhone ?? "").includes(q);
    }
    return true;
  });

  return (
    <div>
      {/* Stats */}
      <div className="summary-chips" style={{ marginBottom: "1rem" }}>
        <span className="summary-chip" style={{ color: "#a855f7" }}>{active.length} reservas ativas</span>
        <span className="summary-chip" style={{ color: "#fb923c" }}>{upcoming.length} esta semana</span>
        <span className="summary-chip" style={{ color: "#22c55e" }}>{revenue.toFixed(2)}€ receita</span>
        <span className="summary-chip" style={{ color: "#ef4444" }}>{unpaid.length} por pagar</span>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        {/* View toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 7, padding: "0.2rem" }}>
          <button
            onClick={() => setViewMode("list")}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "0.3rem 0.7rem", borderRadius: 5, border: "none", cursor: "pointer", fontSize: "0.82rem", background: viewMode === "list" ? "#f97316" : "transparent", color: viewMode === "list" ? "#fff" : "#888", transition: "all 0.15s" }}
          ><List size={13} /> Lista</button>
          <button
            onClick={() => setViewMode("calendar")}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "0.3rem 0.7rem", borderRadius: 5, border: "none", cursor: "pointer", fontSize: "0.82rem", background: viewMode === "calendar" ? "#f97316" : "transparent", color: viewMode === "calendar" ? "#fff" : "#888", transition: "all 0.15s" }}
          ><CalendarDays size={13} /> Calendário</button>
        </div>

        {viewMode === "list" && (
          <>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: "0.4rem 0.6rem", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#f1f1f1", fontSize: "0.85rem" }}>
              <option value="">Todos os estados</option>
              <option value="ACTIVE">Ativas</option>
              <option value="COMPLETED">Concluídas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
            <input placeholder="Pesquisar cliente, lugar..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
              style={{ padding: "0.4rem 0.7rem", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#f1f1f1", fontSize: "0.85rem", flex: 1, minWidth: 160 }} />
          </>
        )}

        <button className="export-btn" onClick={handleExportExcel}><Download size={14} /> Exportar Excel</button>
        <button className="action-btn primary" style={{ width: "auto", padding: "0.4rem 0.9rem" }} onClick={openNew}>
          <Plus size={15} /> Nova Reserva
        </button>
      </div>

      {/* Calendar view */}
      {viewMode === "calendar" && <CalendarView reservations={reservations} />}

      {/* List view */}
      {viewMode === "list" && (loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}><Loader2 size={24} className="conc-spin" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Sem reservas.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#888", textAlign: "left" }}>
                <th style={{ padding: "0.5rem 0.8rem" }}>Cliente</th>
                <th style={{ padding: "0.5rem 0.8rem" }}>Lugar</th>
                <th style={{ padding: "0.5rem 0.8rem" }}>Datas</th>
                <th style={{ padding: "0.5rem 0.8rem" }}>Dias</th>
                <th style={{ padding: "0.5rem 0.8rem" }}>Modalidade</th>
                <th style={{ padding: "0.5rem 0.8rem" }}>Total</th>
                <th style={{ padding: "0.5rem 0.8rem" }}>Pago</th>
                <th style={{ padding: "0.5rem 0.8rem" }}>Estado</th>
                <th style={{ padding: "0.5rem 0.8rem" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.5rem 0.8rem" }}>
                    <div style={{ fontWeight: 600 }}>{r.clientName}</div>
                    {r.clientPhone && <div style={{ fontSize: "0.75rem", color: "#888" }}>{r.clientPhone}</div>}
                  </td>
                  <td style={{ padding: "0.5rem 0.8rem", fontWeight: 700 }}>{r.spot.spotNumber}</td>
                  <td style={{ padding: "0.5rem 0.8rem", whiteSpace: "nowrap" }}>{r.startDate} → {r.endDate}</td>
                  <td style={{ padding: "0.5rem 0.8rem" }}>{calcDays(r.startDate, r.endDate)}</td>
                  <td style={{ padding: "0.5rem 0.8rem" }}>
                    <span className={`status-badge ${r.period === "MORNING" ? "morning" : r.period === "AFTERNOON" ? "afternoon" : "full"}`}>
                      {periodLabel(r.period)}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.8rem", fontWeight: 600 }}>{r.totalPrice.toFixed(2)}€</td>
                  <td style={{ padding: "0.5rem 0.8rem" }}><span style={{ color: r.isPaid ? "#22c55e" : "#ef4444" }}>{r.isPaid ? "✓" : "✗"}</span></td>
                  <td style={{ padding: "0.5rem 0.8rem" }}><span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                  <td style={{ padding: "0.5rem 0.6rem" }}>
                    {r.status === "ACTIVE" && (
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <button onClick={() => openEdit(r)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4 }} title="Editar"><Edit2 size={14} /></button>
                        <button onClick={() => handleCancel(r.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }} title="Cancelar"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Drawer */}
      {showDrawer && (
        <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && setShowDrawer(false)}>
          <div className="panel-drawer">
            <div className="panel-head">
              <h3>{editing ? "Editar Reserva" : "Nova Reserva"}</h3>
              <button className="panel-close" onClick={() => setShowDrawer(false)}><X size={18} /></button>
            </div>
            <div className="panel-body">
              <div className="field-group">
                <label>Nome do cliente *</label>
                <input value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} />
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Telefone</label>
                  <input value={form.clientPhone} onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label>Email</label>
                  <input type="email" value={form.clientEmail} onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))} />
                </div>
              </div>
              <div className="field-group">
                <label>Lugar {extraSpotIds.length > 0 ? "1" : ""} *</label>
                <select value={form.spotId} onChange={(e) => { setForm((p) => ({ ...p, spotId: e.target.value })); setConflictAlts(null); setConflictDates([]); setFormError(""); }}>
                  <option value="">— selecionar —</option>
                  {concession.spots.map((s) => (
                    <option key={s.id} value={s.id} disabled={blockedSpotIds.has(s.id)}>
                      Lugar {s.spotNumber}{blockedSpotIds.has(s.id) ? " (ocupado)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              {extraSpotIds.map((sid, idx) => (
                <div key={idx} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
                  <div className="field-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Lugar {idx + 2} *</label>
                    <select value={sid} onChange={(e) => {
                      const updated = [...extraSpotIds];
                      updated[idx] = e.target.value;
                      setExtraSpotIds(updated);
                    }}>
                      <option value="">— selecionar —</option>
                      {concession.spots.map((s) => (
                        <option key={s.id} value={s.id} disabled={blockedSpotIds.has(s.id)}>
                          Lugar {s.spotNumber}{blockedSpotIds.has(s.id) ? " (ocupado)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExtraSpotIds((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ padding: "0.45rem 0.6rem", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, color: "#ef4444", cursor: "pointer", marginBottom: 0 }}
                    title="Remover chapéu"
                  ><X size={14} /></button>
                </div>
              ))}
              {!editing && (
                <button
                  type="button"
                  onClick={() => setExtraSpotIds((prev) => [...prev, ""])}
                  style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.8rem", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 7, color: "#f97316", cursor: "pointer", fontSize: "0.82rem", width: "auto" }}
                >
                  <Plus size={13} /> Adicionar Chapéu
                </button>
              )}
              <div className="field-row">
                <div className="field-group">
                  <label>Data início *</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label>Data fim *</label>
                  <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Modalidade</label>
                  <select value={form.period} onChange={(e) => setForm((p) => ({ ...p, period: e.target.value }))}>
                    <option value="MORNING">Manhã</option>
                    <option value="AFTERNOON">Tarde</option>
                    <option value="FULL_DAY">Dia Inteiro</option>
                  </select>
                </div>
                <div className="field-group">
                  <label>Camas</label>
                  <select
                    value={form.bedConfig === "EXTRA_BED" ? "TWO_BEDS" : form.bedConfig}
                    onChange={(e) => {
                      const b = e.target.value;
                      setForm((p) => ({ ...p, bedConfig: b === "ONE_BED" ? "ONE_BED" : "TWO_BEDS" }));
                    }}
                  >
                    <option value="TWO_BEDS">2 camas</option>
                    <option value="ONE_BED">1 cama (chapéu)</option>
                  </select>
                </div>
              </div>
              {form.bedConfig !== "ONE_BED" && (
                <div className="toggle-row">
                  <span style={{ fontSize: "0.85rem", color: "#aaa" }}>+ Cama Extra (+{concession.priceExtraBed.toFixed(2)}€/dia)</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={form.bedConfig === "EXTRA_BED"}
                      onChange={(e) => setForm((p) => ({ ...p, bedConfig: e.target.checked ? "EXTRA_BED" : "TWO_BEDS" }))}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              )}
              <div className="field-row">
                <div className="field-group">
                  <label>Preço total (€)</label>
                  <input type="number" step="0.5" min="0" value={form.totalPrice} onChange={(e) => setForm((p) => ({ ...p, totalPrice: e.target.value }))} />
                </div>
                <div className="field-group" style={{ justifyContent: "flex-end" }}>
                  <label>Pago</label>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={form.isPaid} onChange={(e) => setForm((p) => ({ ...p, isPaid: e.target.checked }))} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>
              <div className="field-group">
                <label>Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
              {form.startDate && form.endDate && (
                <div style={{ fontSize: "0.8rem", color: "#888", background: "rgba(255,255,255,0.04)", padding: "0.5rem 0.7rem", borderRadius: 6 }}>
                  {calcDays(form.startDate, form.endDate)} dia(s) × {periodLabel(form.period)} — {bedLabel(form.bedConfig)}
                </div>
              )}
              {formError && <p style={{ color: "#ef4444", fontSize: "0.82rem", margin: 0 }}>{formError}</p>}
              {conflictAlts && conflictAlts.length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 9, padding: "0.8rem" }}>
                  <div style={{ fontSize: "0.78rem", color: "#f97316", fontWeight: 700, marginBottom: "0.5rem" }}>Alternativas disponíveis:</div>
                  {conflictAlts.map((alt) => (
                    <div key={alt.spotId} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "0.82rem" }}>
                      <span style={{ fontWeight: 700, minWidth: 56, color: alt.blockedDates.length === 0 ? "#22c55e" : "#fb923c" }}>
                        Lugar {alt.spotNumber}
                      </span>
                      <span style={{ flex: 1, color: "#888", fontSize: "0.74rem" }}>
                        {alt.blockedDates.length === 0
                          ? "✓ disponível para todo o período"
                          : `⚠ ocupado em: ${alt.blockedDates.slice(0, 3).join(", ")}${alt.blockedDates.length > 3 ? ` +${alt.blockedDates.length - 3}` : ""}`}
                      </span>
                      <button
                        onClick={() => { setForm((p) => ({ ...p, spotId: alt.spotId })); setConflictAlts(null); setConflictDates([]); setFormError(""); }}
                        style={{ padding: "0.2rem 0.55rem", background: alt.blockedDates.length === 0 ? "#16a34a" : "rgba(249,115,22,0.2)", border: "none", borderRadius: 5, color: "#fff", fontSize: "0.74rem", cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        {alt.blockedDates.length === 0 ? "Usar este" : "Selecionar"}
                      </button>
                    </div>
                  ))}
                  {conflictAlts.every((a) => a.blockedDates.length > 0) && (
                    <div style={{ fontSize: "0.74rem", color: "#888", marginTop: "0.5rem", lineHeight: 1.4 }}>
                      Nenhum lugar disponível para o período completo. Considere dividir a reserva em datas separadas.
                    </div>
                  )}
                </div>
              )}
              <button className="action-btn primary" onClick={handleSubmit} disabled={formBusy}>
                {formBusy ? <Loader2 size={14} className="conc-spin" /> : null}
                {editing ? "Guardar alterações" : "Criar Reserva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
