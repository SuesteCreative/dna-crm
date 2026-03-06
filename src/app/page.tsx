"use client";

export const dynamic = "force-dynamic";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState, Fragment } from "react";
import {
  Calendar, RefreshCcw, Plus, Search,
  CheckCircle, Clock, X, Download, FileText,
  TrendingUp, Activity, ShoppingBag,
  AlertCircle, Trash2, ChevronDown, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { exportToExcel, exportToPDF } from "@/lib/export";
import "./Dashboard.css";

interface Booking {
  id: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  activityDate: string;
  activityTime: string | null;
  pax: number;
  status: string;
  source: string;
  shopifyId?: string | null;
  orderNumber?: string | null;
  totalPrice: number | null;
  quantity?: number | null;
  notes?: string | null;
  activityType?: string | null;
}

interface Service {
  id: string;
  name: string;
  variant: string | null;
  sku: string | null;
  price: number | null;
  category: string | null;
}

const defaultForm = {
  customerName: "", customerEmail: "", customerPhone: "",
  activityDate: "", activityTime: "", pax: 1, totalPrice: "",
  serviceId: "", activityType: ""
};

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isSignedIn) {
      fetchBookings();
      fetchServices();
    }
  }, [isSignedIn]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(bookings.filter(b =>
      b.customerName.toLowerCase().includes(q) ||
      (b.customerEmail || "").toLowerCase().includes(q) ||
      (b.activityType || "").toLowerCase().includes(q)
    ));
  }, [search, bookings]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      if (!res.ok) { setBookings([]); return; }
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch { setBookings([]); }
    finally { setLoading(false); }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch { }
  };

  // Helper function to call the sync API
  const syncShopifyOrders = async () => {
    const res = await fetch("/api/shopify/sync", { method: "POST" });
    return res.json();
  };

  const handleSync = async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const data = await syncShopifyOrders();
      if (data.success) {
        let msg = `Sincronizado: ${data.count} importadas`;
        if (data.failed > 0) msg += `, ${data.failed} falhas`;
        msg += ` (${data.debugInfo.domain})`;
        setSyncMsg(msg);
        await fetchBookings();
      } else {
        setSyncMsg(`Erro: ${data.error}`);
      }
    } catch { setSyncMsg("Erro de ligação"); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(null), 4000); }
  };

  const toggleGroup = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const groupBookings = (data: Booking[]) => {
    const groups: Record<string, Record<string, Booking[]>> = {};

    data.forEach(b => {
      const date = new Date(b.activityDate);
      const year = date.getFullYear().toString();
      const monthDisplay = format(date, "MMMM", { locale: pt });
      const monthKey = monthDisplay.charAt(0).toUpperCase() + monthDisplay.slice(1);

      if (!groups[year]) groups[year] = {};
      if (!groups[year][monthKey]) groups[year][monthKey] = [];
      groups[year][monthKey].push(b);
    });

    return groups;
  };

  const grouped = groupBookings(filtered);
  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = (b: Booking) => {
    const d = new Date(b.activityDate);
    return d >= todayStart && d < tomorrow;
  };
  const isFuture = (b: Booking) => new Date(b.activityDate) >= tomorrow;

  const anyTodayInGroup = (bookings: Booking[]) => bookings.some(isToday);
  const anyFutureInGroup = (bookings: Booking[]) => bookings.some(isFuture);

  const anyTodayInYear = (year: string) =>
    Object.values(grouped[year]).some(monthList => anyTodayInGroup(monthList));
  const anyFutureInYear = (year: string) =>
    Object.values(grouped[year]).some(monthList => anyFutureInGroup(monthList));

  const handleServiceSelect = (serviceId: string) => {
    // ... existing handleServiceSelect logic
    const svc = services.find(s => s.id === serviceId);
    if (!svc) { setFormData({ ...formData, serviceId: "", activityType: "", totalPrice: "" }); return; }
    const label = svc.variant ? `${svc.name} — ${svc.variant}` : svc.name;
    setFormData({
      ...formData,
      serviceId: svc.id,
      activityType: label,
      totalPrice: svc.price?.toString() || ""
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false); setFormData(defaultForm); fetchBookings();
      } else {
        const d = await res.json();
        setFormError(d.error || "Erro ao criar reserva");
      }
    } catch { setFormError("Erro de ligação"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta reserva?")) return;
    try {
      const res = await fetch(`/api/bookings/delete?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchBookings();
      else alert("Erro ao eliminar reserva");
    } catch { alert("Erro de ligação"); }
  };

  const svcGroups: Record<string, Service[]> = {};
  for (const s of services) {
    const cat = s.category || "Outros";
    if (!svcGroups[cat]) svcGroups[cat] = [];
    svcGroups[cat].push(s);
  }

  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;
  const pending = bookings.filter(b => b.status === "PENDING").length;
  const revenue = bookings.reduce((s, b) => s + (b.totalPrice || 0), 0);

  const statusBadge = (s: string) => {
    const cls: Record<string, string> = { CONFIRMED: "badge-confirmed", PENDING: "badge-pending", CANCELLED: "badge-cancelled" };
    const lbl: Record<string, string> = { CONFIRMED: "Confirmada", PENDING: "Pendente", CANCELLED: "Cancelada" };
    return <span className={`badge ${cls[s] || "badge-pending"}`}>{lbl[s] || s}</span>;
  };

  const sourceBadge = (s: string, orderNumber?: string | null) => {
    const cls: Record<string, string> = { SHOPIFY: "src-shopify", MANUAL: "src-manual", PARTNER: "src-partner" };
    return (
      <div className="source-stack">
        <span className={`src-badge ${cls[s] || "src-manual"}`}>{s}</span>
        {orderNumber && <span className="order-no-sub">{orderNumber}</span>}
      </div>
    );
  };

  if (!isLoaded) return (
    <div className="loading-screen"><div className="loader" /></div>
  );

  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <main className="crm-main">
      <header className="crm-topbar">
        <div>
          <h1 className="page-title">Reservas</h1>
          <p className="page-sub">Gerencie todas as atividades e agendamentos.</p>
        </div>
        <div className="topbar-actions">
          <button className="btn-ghost" onClick={() => exportToExcel(bookings, "reservas-dna")}><Download size={16} /> Excel</button>
          <button className="btn-ghost" onClick={() => exportToPDF(bookings, "reservas-dna")}><FileText size={16} /> PDF</button>
          <button className={`btn-outline ${syncing ? "syncing" : ""}`} onClick={handleSync} disabled={syncing}>
            <RefreshCcw size={16} className={syncing ? "spin" : ""} />
            {syncing ? "Sincronizando..." : "Sync Shopify"}
          </button>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Nova Reserva
          </button>
        </div>
      </header>

      {syncMsg && (
        <div className={`sync-toast ${syncMsg.startsWith("Erro") ? "error" : "success"}`}>
          {syncMsg.startsWith("Erro") ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {syncMsg}
        </div>
      )}

      <section className="stats-row">
        <div className="stat-tile blue">
          <div className="tile-ico"><Calendar size={22} /></div>
          <div className="tile-info"><span className="tile-val">{bookings.length}</span><span className="tile-lbl">Total de Reservas</span></div>
          <TrendingUp size={40} className="tile-bg-ico" />
        </div>
        <div className="stat-tile green">
          <div className="tile-ico"><CheckCircle size={22} /></div>
          <div className="tile-info"><span className="tile-val">{confirmed}</span><span className="tile-lbl">Confirmadas</span></div>
          <CheckCircle size={40} className="tile-bg-ico" />
        </div>
        <div className="stat-tile amber">
          <div className="tile-ico"><Clock size={22} /></div>
          <div className="tile-info"><span className="tile-val">{pending}</span><span className="tile-lbl">Pendentes</span></div>
          <Clock size={40} className="tile-bg-ico" />
        </div>
        <div className="stat-tile teal">
          <div className="tile-ico"><Activity size={22} /></div>
          <div className="tile-info"><span className="tile-val">{revenue.toFixed(0)}€</span><span className="tile-lbl">Receita Total</span></div>
          <TrendingUp size={40} className="tile-bg-ico" />
        </div>
      </section>

      <section className="dashboard-content">
        <div className="table-card-header">
          <h2>Reservas Recentes</h2>
          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input className="search-input" placeholder="Pesquisar cliente, email ou atividade..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button className="search-clear" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="table-empty"><div className="loader-sm" /></div>
        ) : years.length === 0 ? (
          <div className="table-empty">Nenhuma reserva encontrada.</div>
        ) : years.map(year => {
          const yearHasFuture = anyFutureInYear(year);
          const yearHasToday = !yearHasFuture && anyTodayInYear(year);
          const yearClass = yearHasFuture ? "is-future" : yearHasToday ? "is-today" : "";
          return (
          <div key={year} className={`year-section ${yearClass}`}>
            <div className={`year-box-hdr ${yearClass}`} onClick={() => toggleGroup(year)}>
              <ChevronDown size={20} className={collapsed[year] ? "group-ico collapsed" : "group-ico"} />
              <h3>Ano {year}</h3>
            </div>

            {!collapsed[year] && (
              <div className="year-content">
                {Object.keys(grouped[year]).sort((a, b) => {
                  const monthsOrder = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                  return monthsOrder.indexOf(b) - monthsOrder.indexOf(a);
                }).map(month => {
                  const mKey = `${year}-${month}`;
                  const monthBookings = grouped[year][month];
                  const hasFuture = anyFutureInGroup(monthBookings);
                  const hasToday = !hasFuture && anyTodayInGroup(monthBookings);
                  const monthClass = hasFuture ? "is-future" : hasToday ? "is-today" : "";
                  return (
                    <div key={mKey} className={`month-section ${monthClass}`}>
                      <div className={`month-box-hdr ${monthClass}`} onClick={() => toggleGroup(mKey)}>
                        <div className="month-title">
                          <ChevronDown size={14} className={collapsed[mKey] ? "group-ico collapsed" : "group-ico"} />
                          {month}
                        </div>
                        <span className="month-badge">{monthBookings.length} {monthBookings.length === 1 ? 'reserva' : 'reservas'}</span>
                      </div>

                      {!collapsed[mKey] && (
                        <div className="table-wrap">
                          <table className="crm-table">
                            <thead>
                              <tr>
                                <th>Cliente</th>
                                <th style={{ width: "80px" }}>Qtd</th>
                                <th>Atividade</th>
                                <th>Data / Hora</th>
                                <th>Pax</th>
                                <th>Fonte</th>
                                <th>Status</th>
                                <th>Preço</th>
                                <th style={{ width: "50px" }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthBookings.map(b => (
                                <tr key={b.id} className={isFuture(b) ? "row-future" : isToday(b) ? "row-today" : ""}>
                                  <td>
                                    <div className="cell-name">{b.customerName}</div>
                                    <div className="cell-sub">{b.customerEmail || "—"}</div>
                                  </td>
                                  <td>
                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                      <span className="qty-badge">
                                        {b.quantity || 1}
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="cell-name">{b.activityType || b.notes || "—"}</div>
                                  </td>
                                  <td>
                                    <div className="cell-name">{new Date(b.activityDate).toLocaleDateString("pt-PT")}</div>
                                    <div className="cell-sub">{b.activityTime || "—"}</div>
                                  </td>
                                  <td><span className="pax-pill">{b.pax} pax</span></td>
                                  <td>{sourceBadge(b.source, b.orderNumber)}</td>
                                  <td>{statusBadge(b.status)}</td>
                                  <td className="price-cell">{b.totalPrice != null ? `${b.totalPrice.toFixed(2)}€` : "—"}</td>
                                  <td>
                                    <button className="btn-delete" onClick={() => handleDelete(b.id)}>
                                      <Trash2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })}
      </section>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>Nova Reserva Manual</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              {formError && <div className="form-error"><AlertCircle size={14} />{formError}</div>}
              <div className="form-grid">
                <div className="field full">
                  <label>Atividade / Serviço</label>
                  <select
                    className="field-select"
                    value={formData.serviceId}
                    onChange={e => handleServiceSelect(e.target.value)}
                  >
                    <option value="">— Selecionar atividade —</option>
                    {Object.entries(svcGroups).map(([cat, items]) => (
                      <optgroup key={cat} label={cat}>
                        {items.map(svc => (
                          <option key={svc.id} value={svc.id}>
                            {svc.name}{svc.variant ? ` — ${svc.variant}` : ""}{svc.price ? ` (${svc.price}€)` : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {/* ... other fields ... */}
                <div className="field">
                  <label>Nome do Cliente *</label>
                  <input value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <input value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} />
                </div>
                <div className="field">
                  <label>Data da Atividade *</label>
                  <input type="date" value={formData.activityDate} onChange={e => setFormData({ ...formData, activityDate: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Hora</label>
                  <input type="time" value={formData.activityTime} onChange={e => setFormData({ ...formData, activityTime: e.target.value })} />
                </div>
                <div className="field">
                  <label>Nº Pessoas *</label>
                  <input type="number" min="1" value={formData.pax} onChange={e => setFormData({ ...formData, pax: parseInt(e.target.value) })} required />
                </div>
                <div className="field">
                  <label>Preço Total (€)</label>
                  <input type="number" step="0.01" value={formData.totalPrice} onChange={e => setFormData({ ...formData, totalPrice: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Reserva</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
