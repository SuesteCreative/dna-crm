"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, X, Download, Loader2, Edit2, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";

interface Spot {
  id: string;
  spotNumber: number;
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

interface Reservation {
  id: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  startDate: string;
  endDate: string;
  period: string;
  bedConfig: string;
  totalPrice: number;
  isPaid: boolean;
  notes?: string;
  status: string;
  spot: Spot;
  createdAt: string;
}

function calcDays(start: string, end: string) {
  const s = new Date(start + "T12:00:00Z");
  const e = new Date(end + "T12:00:00Z");
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
}

function periodLabel(p: string) {
  return p === "MORNING" ? "Manhã" : p === "AFTERNOON" ? "Tarde" : "Dia Inteiro";
}

function bedLabel(b: string) {
  return b === "ONE_BED" ? "1 cama" : b === "EXTRA_BED" ? "3 camas" : "2 camas";
}

function calcPrice(period: string, bedConfig: string, days: number, concession: Concession) {
  const base =
    period === "MORNING" ? concession.priceMorning :
    period === "AFTERNOON" ? concession.priceAfternoon :
    concession.priceFull;
  const daily =
    bedConfig === "ONE_BED" ? concession.priceOneBed :
    bedConfig === "EXTRA_BED" ? base + concession.priceExtraBed :
    base;
  return daily * days;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function Reservations({ concession }: { concession: Concession }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [filterSearch, setFilterSearch] = useState("");

  // Form
  const [form, setForm] = useState({
    clientName: "", clientPhone: "", clientEmail: "",
    spotId: "", startDate: today(), endDate: today(),
    period: "FULL_DAY", bedConfig: "TWO_BEDS",
    totalPrice: "", isPaid: false, notes: "",
  });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState("");

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

  // Auto-calc price when form fields change
  useEffect(() => {
    if (!form.startDate || !form.endDate || !form.period || !form.bedConfig) return;
    const days = calcDays(form.startDate, form.endDate);
    const price = calcPrice(form.period, form.bedConfig, days, concession);
    setForm((prev) => ({ ...prev, totalPrice: String(price.toFixed(2)) }));
  }, [form.startDate, form.endDate, form.period, form.bedConfig, concession]);

  const openNew = () => {
    setEditing(null);
    setForm({
      clientName: "", clientPhone: "", clientEmail: "",
      spotId: concession.spots[0]?.id ?? "", startDate: today(), endDate: today(),
      period: "FULL_DAY", bedConfig: "TWO_BEDS",
      totalPrice: String(concession.priceFull), isPaid: false, notes: "",
    });
    setFormError("");
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
    setFormError("");
    setShowDrawer(true);
  };

  const handleSubmit = async () => {
    if (!form.clientName.trim()) { setFormError("Nome do cliente obrigatório"); return; }
    if (!form.spotId) { setFormError("Selecionar lugar"); return; }
    setFormBusy(true); setFormError("");
    const url = editing
      ? `/api/concessions/${concession.slug}/reservations/${editing.id}`
      : `/api/concessions/${concession.slug}/reservations`;
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, totalPrice: parseFloat(form.totalPrice) }),
    });
    const data = await res.json();
    setFormBusy(false);
    if (!res.ok) { setFormError(data.error || "Erro ao guardar"); return; }
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
      Cliente: r.clientName,
      Telefone: r.clientPhone ?? "",
      Email: r.clientEmail ?? "",
      Lugar: r.spot.spotNumber,
      "Data Início": r.startDate,
      "Data Fim": r.endDate,
      Dias: calcDays(r.startDate, r.endDate),
      Modalidade: periodLabel(r.period),
      Camas: bedLabel(r.bedConfig),
      "Total (€)": r.totalPrice.toFixed(2),
      Pago: r.isPaid ? "Sim" : "Não",
      Estado: r.status,
      Notas: r.notes ?? "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 22 }, { wch: 14 }, { wch: 24 }, { wch: 7 },
      { wch: 12 }, { wch: 12 }, { wch: 6 }, { wch: 14 },
      { wch: 12 }, { wch: 10 }, { wch: 6 }, { wch: 12 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Reservas");
    XLSX.writeFile(wb, `reservas-${concession.slug}.xlsx`);
  };

  // Stats
  const active = reservations.filter((r) => r.status === "ACTIVE");
  const unpaid = active.filter((r) => !r.isPaid);
  const revenue = active.reduce((s, r) => s + r.totalPrice, 0);
  const tomorrowStr = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  })();
  const upcoming = active.filter((r) => r.startDate >= today() && r.startDate <= tomorrowStr);

  const filtered = reservations.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      return (
        r.clientName.toLowerCase().includes(q) ||
        r.spot.spotNumber.toString().includes(q) ||
        (r.clientPhone ?? "").includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Stats bar */}
      <div className="summary-chips" style={{ marginBottom: "1rem" }}>
        <span className="summary-chip" style={{ color: "#a855f7" }}>{active.length} reservas ativas</span>
        <span className="summary-chip" style={{ color: "#fb923c" }}>{upcoming.length} esta semana</span>
        <span className="summary-chip" style={{ color: "#22c55e" }}>{revenue.toFixed(2)}€ receita</span>
        <span className="summary-chip" style={{ color: "#ef4444" }}>{unpaid.length} por pagar</span>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem", alignItems: "center" }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "0.4rem 0.6rem", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#f1f1f1", fontSize: "0.85rem" }}
        >
          <option value="">Todos os estados</option>
          <option value="ACTIVE">Ativas</option>
          <option value="COMPLETED">Concluídas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
        <input
          placeholder="Pesquisar cliente, lugar..."
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          style={{ padding: "0.4rem 0.7rem", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#f1f1f1", fontSize: "0.85rem", flex: 1, minWidth: 160 }}
        />
        <button className="export-btn" onClick={handleExportExcel}>
          <Download size={14} /> Exportar Excel
        </button>
        <button className="action-btn primary" style={{ width: "auto", padding: "0.4rem 0.9rem" }} onClick={openNew}>
          <Plus size={15} /> Nova Reserva
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>
          <Loader2 size={24} className="conc-spin" />
        </div>
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
                  <td style={{ padding: "0.5rem 0.8rem", whiteSpace: "nowrap" }}>
                    {r.startDate} → {r.endDate}
                  </td>
                  <td style={{ padding: "0.5rem 0.8rem" }}>{calcDays(r.startDate, r.endDate)}</td>
                  <td style={{ padding: "0.5rem 0.8rem" }}>
                    <span className={`status-badge ${r.period.toLowerCase().replace("_day", "").replace("full", "full")}`}>
                      {periodLabel(r.period)}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.8rem", fontWeight: 600 }}>{r.totalPrice.toFixed(2)}€</td>
                  <td style={{ padding: "0.5rem 0.8rem" }}>
                    <span style={{ color: r.isPaid ? "#22c55e" : "#ef4444" }}>{r.isPaid ? "✓" : "✗"}</span>
                  </td>
                  <td style={{ padding: "0.5rem 0.8rem" }}>
                    <span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span>
                  </td>
                  <td style={{ padding: "0.5rem 0.6rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {r.status === "ACTIVE" && (
                        <>
                          <button onClick={() => openEdit(r)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 4 }} title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleCancel(r.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4 }} title="Cancelar">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                <label>Lugar *</label>
                <select value={form.spotId} onChange={(e) => setForm((p) => ({ ...p, spotId: e.target.value }))}>
                  <option value="">— selecionar —</option>
                  {concession.spots.map((s) => (
                    <option key={s.id} value={s.id}>Lugar {s.spotNumber}</option>
                  ))}
                </select>
              </div>
              <div className="field-row">
                <div className="field-group">
                  <label>Data início *</label>
                  <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div className="field-group">
                  <label>Data fim *</label>
                  <input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
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
                  <select value={form.bedConfig} onChange={(e) => setForm((p) => ({ ...p, bedConfig: e.target.value }))}>
                    <option value="TWO_BEDS">2 camas</option>
                    <option value="ONE_BED">1 cama</option>
                    <option value="EXTRA_BED">3 camas (extra)</option>
                  </select>
                </div>
              </div>
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
