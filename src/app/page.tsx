"use client";

export const dynamic = "force-dynamic";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState, Fragment } from "react";
import {
  Calendar, RefreshCcw, Plus, Search,
  CheckCircle, Clock, X, Download, FileText,
  TrendingUp, Activity, UserCheck,
  AlertCircle, Trash2, ChevronDown, ChevronRight, Pencil
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
  serviceId?: string | null;
  totalPrice: number | null;
  quantity?: number | null;
  notes?: string | null;
  activityType?: string | null;
  showedUp?: boolean | null;
  isEdited?: boolean | null;
  originalActivityType?: string | null;
  originalPax?: number | null;
  originalQuantity?: number | null;
  originalTotalPrice?: number | null;
  originalActivityDate?: string | null;
  originalActivityTime?: string | null;
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
  activityDate: "", activityTime: "", pax: 1, quantity: 1, totalPrice: "",
  serviceId: "", activityType: "", discountAmount: "", discountType: "%"
};

function recalcPrice(unitPrice: number | null, qty: number, discAmt: string, discType: string): string {
  if (unitPrice == null) return "";
  const base = unitPrice * qty;
  const d = parseFloat(discAmt) || 0;
  if (d <= 0) return base.toFixed(2);
  const final = discType === "%" ? base * (1 - d / 100) : base - d;
  return Math.max(0, final).toFixed(2);
}

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
  const [attendanceTarget, setAttendanceTarget] = useState<Booking | null>(null);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [expandedGhosts, setExpandedGhosts] = useState<Record<string, boolean>>({});
  const toggleGhost = (id: string) => setExpandedGhosts(prev => ({ ...prev, [id]: !prev[id] }));
  const [createUnitPrice, setCreateUnitPrice] = useState<number | null>(null);
  const [editUnitPrice, setEditUnitPrice] = useState<number | null>(null);

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
    const svc = services.find(s => s.id === serviceId);
    if (!svc) {
      setCreateUnitPrice(null);
      setFormData({ ...formData, serviceId: "", activityType: "", totalPrice: "" });
      return;
    }
    const label = svc.variant ? `${svc.name} — ${svc.variant}` : svc.name;
    const unitPrice = svc.price ?? null;
    setCreateUnitPrice(unitPrice);
    setFormData({
      ...formData,
      serviceId: svc.id,
      activityType: label,
      totalPrice: recalcPrice(unitPrice, formData.quantity, formData.discountAmount, formData.discountType),
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { discountAmount, discountType, ...payload } = formData;
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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

  const handleAttendance = async (booking: Booking) => {
    setAttendanceSaving(true);
    try {
      const res = await fetch("/api/bookings/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: booking.id, showedUp: true }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, showedUp: true } : b));
      }
    } catch { }
    finally {
      setAttendanceSaving(false);
      setAttendanceTarget(null);
    }
  };

  const openEdit = (b: Booking) => {
    setEditTarget(b);
    setEditError(null);
    // Resolve unit price for recalc
    let unitPrice: number | null = null;
    const svcById = b.serviceId ? services.find(s => s.id === b.serviceId) : null;
    if (svcById?.price != null) {
      unitPrice = svcById.price;
    } else if (b.activityType) {
      const svcByType = services.find(s => {
        const label = s.variant ? `${s.name} - ${s.variant}` : s.name;
        return label === b.activityType || (s.variant ? `${s.name} — ${s.variant}` : s.name) === b.activityType;
      });
      unitPrice = svcByType?.price ?? null;
    }
    setEditUnitPrice(unitPrice);
    const d = new Date(b.activityDate);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setEditForm({
      customerName: b.customerName,
      customerEmail: b.customerEmail || "",
      customerPhone: b.customerPhone || "",
      activityDate: dateStr,
      activityTime: b.activityTime || "",
      pax: b.pax,
      quantity: b.quantity ?? 1,
      totalPrice: b.totalPrice ?? "",
      activityType: b.activityType || "",
      status: b.status,
      notes: b.notes || "",
      discountAmount: "",
      discountType: "%",
    });
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setEditSaving(true); setEditError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { discountAmount, discountType, ...editPayload } = editForm;
      const res = await fetch("/api/bookings/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTarget.id, ...editPayload }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
        setEditTarget(null);
      } else {
        const d = await res.json();
        setEditError(d.error || "Erro ao guardar");
      }
    } catch { setEditError("Erro de ligação"); }
    finally { setEditSaving(false); }
  };

  const handleEditDelete = async () => {
    if (!editTarget) return;
    if (!confirm(`Eliminar reserva de ${editTarget.customerName}?`)) return;
    try {
      const res = await fetch(`/api/bookings/delete?id=${editTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== editTarget.id));
        setEditTarget(null);
      } else { alert("Erro ao eliminar reserva"); }
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
                                <th style={{ width: "44px" }}>Pres.</th>
                                <th style={{ width: "44px" }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthBookings.map(b => (
                                <Fragment key={b.id}>
                                <tr className={isFuture(b) ? "row-future" : isToday(b) ? "row-today" : ""}>
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
                                    <div className="cell-name cell-activity-row">
                                      <span>{b.activityType || b.notes || "—"}</span>
                                      {b.isEdited && (
                                        <span className="activity-badges">
                                          <span className="badge-edited">Editada</span>
                                          <button
                                            className="btn-ghost-toggle"
                                            title={expandedGhosts[b.id] ? "Esconder original" : "Ver original"}
                                            onClick={() => toggleGhost(b.id)}
                                          >
                                            <ChevronDown size={11} className={expandedGhosts[b.id] ? "ghost-ico open" : "ghost-ico"} />
                                          </button>
                                        </span>
                                      )}
                                    </div>
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
                                    {b.showedUp === true ? (
                                      <span className="attendance-verified" title="Presença confirmada">
                                        <UserCheck size={16} />
                                      </span>
                                    ) : b.status !== "CANCELLED" ? (
                                      <button
                                        className="btn-attendance"
                                        title="Confirmar presença"
                                        onClick={() => setAttendanceTarget(b)}
                                      >
                                        <UserCheck size={16} />
                                      </button>
                                    ) : null}
                                  </td>
                                  <td>
                                    <button className="btn-edit" onClick={() => openEdit(b)}>
                                      <Pencil size={15} />
                                    </button>
                                  </td>
                                </tr>
                                {b.isEdited && expandedGhosts[b.id] && (() => {
                                  const origQty   = b.originalQuantity ?? b.quantity ?? 1;
                                  const origType  = b.originalActivityType ?? b.activityType ?? "—";
                                  const origPax   = b.originalPax ?? b.pax;
                                  const origPrice = b.originalTotalPrice;
                                  const origDate  = b.originalActivityDate ? new Date(b.originalActivityDate).toLocaleDateString("pt-PT") : null;
                                  const origTime  = b.originalActivityTime ?? null;
                                  const qtyChg    = origQty !== (b.quantity ?? 1);
                                  const typeChg   = b.originalActivityType !== null && b.originalActivityType !== b.activityType;
                                  const paxChg    = b.originalPax !== null && b.originalPax !== b.pax;
                                  const priceChg  = origPrice !== null && origPrice !== b.totalPrice;
                                  const curDate   = new Date(b.activityDate).toLocaleDateString("pt-PT");
                                  const curTime   = b.activityTime ?? null;
                                  const dateChg   = origDate !== null && origDate !== curDate;
                                  const timeChg   = origTime !== null && origTime !== curTime;
                                  const showDate  = origDate !== null;
                                  const showTime  = origTime !== null || timeChg;
                                  return (
                                    <tr className="row-ghost-original">
                                      <td />
                                      <td>
                                        <div style={{ display: "flex", justifyContent: "center" }}>
                                          <span className={`qty-badge qty-badge-ghost${qtyChg ? " ghost-struck" : ""}`}>{origQty}</span>
                                        </div>
                                      </td>
                                      <td>
                                        <div className="cell-activity-row">
                                          <span className={typeChg ? "ghost-text" : "ghost-muted"}>{origType}</span>
                                          <span className="ghost-label">Original</span>
                                        </div>
                                      </td>
                                      <td>
                                        {showDate && (
                                          <div className={dateChg ? "ghost-text" : "ghost-muted"}>{origDate}</div>
                                        )}
                                        {showTime && (
                                          <div className={timeChg ? "ghost-text" : "ghost-muted"}>{origTime || "—"}</div>
                                        )}
                                      </td>
                                      <td><span className={`pax-pill pax-pill-ghost${paxChg ? " ghost-struck" : ""}`}>{origPax} pax</span></td>
                                      <td /><td />
                                      <td className={`price-cell${priceChg ? " ghost-text" : " ghost-muted"}`}>
                                        {origPrice != null ? `${origPrice.toFixed(2)}€` : (b.totalPrice != null ? `${b.totalPrice.toFixed(2)}€` : "—")}
                                      </td>
                                      <td /><td />
                                    </tr>
                                  );
                                })()}
                                </Fragment>
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
                  <label>Quantidade (unidades)</label>
                  <input type="number" min="1" value={formData.quantity} onChange={e => {
                    const qty = parseInt(e.target.value) || 1;
                    setFormData({ ...formData, quantity: qty, totalPrice: recalcPrice(createUnitPrice, qty, formData.discountAmount, formData.discountType) });
                  }} />
                </div>
                <div className="field full discount-row">
                  <label>Desconto</label>
                  <div className="discount-wrap">
                    <input
                      type="number" min="0" step="0.01" placeholder="0"
                      value={formData.discountAmount}
                      onChange={e => {
                        const discAmt = e.target.value;
                        setFormData({ ...formData, discountAmount: discAmt, totalPrice: recalcPrice(createUnitPrice, formData.quantity, discAmt, formData.discountType) });
                      }}
                    />
                    <div className="discount-type-toggle">
                      <button type="button" className={formData.discountType === "%" ? "active" : ""} onClick={() => {
                        setFormData({ ...formData, discountType: "%", totalPrice: recalcPrice(createUnitPrice, formData.quantity, formData.discountAmount, "%") });
                      }}>%</button>
                      <button type="button" className={formData.discountType === "€" ? "active" : ""} onClick={() => {
                        setFormData({ ...formData, discountType: "€", totalPrice: recalcPrice(createUnitPrice, formData.quantity, formData.discountAmount, "€") });
                      }}>€</button>
                    </div>
                  </div>
                </div>
                <div className="field full price-display-row">
                  <label>Preço Total (€)</label>
                  <div className="price-display-wrap">
                    <input type="number" step="0.01" value={formData.totalPrice} onChange={e => setFormData({ ...formData, totalPrice: e.target.value })} />
                    {createUnitPrice != null && (
                      <span className="price-base-hint">{createUnitPrice}€ × {formData.quantity} unid.</span>
                    )}
                  </div>
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
      {editTarget && (
        <>
          <div className="drawer-backdrop" onClick={() => setEditTarget(null)} />
          <aside className="edit-drawer">
            <div className="drawer-hdr">
              <div>
                <div className="drawer-title">{editTarget.customerName}</div>
                <div className="drawer-sub">
                  {editTarget.source === "SHOPIFY" && editTarget.orderNumber
                    ? `Shopify ${editTarget.orderNumber}`
                    : editTarget.source}
                </div>
              </div>
              <button className="modal-close" onClick={() => setEditTarget(null)}><X size={20} /></button>
            </div>

            <div className="drawer-original">
              <span className="drawer-original-label">Original</span>
              <span>{(editTarget.isEdited ? editTarget.originalActivityType : editTarget.activityType) || "—"}</span>
              <span className="attendance-dot">·</span>
              <span>{editTarget.isEdited ? editTarget.originalPax : editTarget.pax} pax</span>
              {(editTarget.isEdited ? editTarget.originalQuantity : editTarget.quantity) != null && <>
                <span className="attendance-dot">·</span>
                <span>{editTarget.isEdited ? editTarget.originalQuantity : editTarget.quantity}x</span>
              </>}
              <span className="attendance-dot">·</span>
              <span>{((editTarget.isEdited ? editTarget.originalTotalPrice : editTarget.totalPrice) ?? null) != null
                ? `${(editTarget.isEdited ? editTarget.originalTotalPrice! : editTarget.totalPrice!).toFixed(2)}€`
                : "—"}</span>
              {editTarget.isEdited && editTarget.originalActivityDate && <>
                <span className="attendance-dot">·</span>
                <span>{new Date(editTarget.originalActivityDate).toLocaleDateString("pt-PT")}</span>
                {editTarget.originalActivityTime && <>
                  <span className="attendance-dot">·</span>
                  <span>{editTarget.originalActivityTime}</span>
                </>}
              </>}
            </div>

            <div className="drawer-body">
              {editError && <div className="form-error"><AlertCircle size={14} />{editError}</div>}

              <div className="drawer-section-label">Atividade</div>
              <div className="form-grid">
                <div className="field full">
                  <label>Tipo de atividade</label>
                  <select className="field-select" value={editForm.activityType} onChange={e => {
                    const val = e.target.value;
                    const svc = services.find(s => (s.variant ? `${s.name} - ${s.variant}` : s.name) === val);
                    const unitPrice = svc?.price ?? null;
                    setEditUnitPrice(unitPrice);
                    const newPrice = recalcPrice(unitPrice, editForm.quantity, editForm.discountAmount, editForm.discountType);
                    setEditForm({ ...editForm, activityType: val, totalPrice: newPrice || editForm.totalPrice });
                  }}>
                    <option value="">— Livre —</option>
                    {Object.entries(svcGroups).map(([cat, items]) => (
                      <optgroup key={cat} label={cat}>
                        {items.map(svc => (
                          <option key={svc.id} value={svc.variant ? `${svc.name} - ${svc.variant}` : svc.name}>
                            {svc.name}{svc.variant ? ` - ${svc.variant}` : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Data</label>
                  <input type="date" value={editForm.activityDate} onChange={e => setEditForm({ ...editForm, activityDate: e.target.value })} />
                </div>
                <div className="field">
                  <label>Hora</label>
                  <input type="time" value={editForm.activityTime} onChange={e => setEditForm({ ...editForm, activityTime: e.target.value })} />
                </div>
                <div className="field">
                  <label>Pax</label>
                  <input type="number" min="1" value={editForm.pax} onChange={e => setEditForm({ ...editForm, pax: e.target.value })} />
                </div>
                <div className="field">
                  <label>Qtd (unidades)</label>
                  <input type="number" min="1" value={editForm.quantity} onChange={e => {
                    const qty = parseInt(e.target.value) || 1;
                    const newPrice = recalcPrice(editUnitPrice, qty, editForm.discountAmount, editForm.discountType);
                    setEditForm({ ...editForm, quantity: qty, totalPrice: newPrice || editForm.totalPrice });
                  }} />
                </div>
                <div className="field full discount-row">
                  <label>Desconto</label>
                  <div className="discount-wrap">
                    <input
                      type="number" min="0" step="0.01" placeholder="0"
                      value={editForm.discountAmount || ""}
                      onChange={e => {
                        const discAmt = e.target.value;
                        const newPrice = recalcPrice(editUnitPrice, editForm.quantity, discAmt, editForm.discountType);
                        setEditForm({ ...editForm, discountAmount: discAmt, totalPrice: newPrice || editForm.totalPrice });
                      }}
                    />
                    <div className="discount-type-toggle">
                      <button type="button" className={(editForm.discountType || "%") === "%" ? "active" : ""} onClick={() => {
                        const newPrice = recalcPrice(editUnitPrice, editForm.quantity, editForm.discountAmount, "%");
                        setEditForm({ ...editForm, discountType: "%", totalPrice: newPrice || editForm.totalPrice });
                      }}>%</button>
                      <button type="button" className={editForm.discountType === "€" ? "active" : ""} onClick={() => {
                        const newPrice = recalcPrice(editUnitPrice, editForm.quantity, editForm.discountAmount, "€");
                        setEditForm({ ...editForm, discountType: "€", totalPrice: newPrice || editForm.totalPrice });
                      }}>€</button>
                    </div>
                  </div>
                </div>
                <div className="field price-display-row">
                  <label>Preço real (€)</label>
                  <div className="price-display-wrap">
                    <input type="number" step="0.01" value={editForm.totalPrice} onChange={e => setEditForm({ ...editForm, totalPrice: e.target.value })} />
                    {editUnitPrice != null && (
                      <span className="price-base-hint">{editUnitPrice}€ × {editForm.quantity} unid.</span>
                    )}
                  </div>
                </div>
                <div className="field full">
                  <label>Estado</label>
                  <select className="field-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="drawer-section-label" style={{ marginTop: 16 }}>Cliente</div>
              <div className="form-grid">
                <div className="field full">
                  <label>Nome</label>
                  <input value={editForm.customerName} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={editForm.customerEmail} onChange={e => setEditForm({ ...editForm, customerEmail: e.target.value })} />
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <input value={editForm.customerPhone} onChange={e => setEditForm({ ...editForm, customerPhone: e.target.value })} />
                </div>
                <div className="field full">
                  <label>Notas</label>
                  <textarea rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button className="btn-drawer-delete" onClick={handleEditDelete}>
                <Trash2 size={15} /> Eliminar
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => setEditTarget(null)}>Cancelar</button>
                <button className="btn-primary" disabled={editSaving} onClick={handleEditSave}>
                  {editSaving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {attendanceTarget && (
        <div className="modal-backdrop" onClick={() => setAttendanceTarget(null)}>
          <div className="modal-box attendance-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAttendanceTarget(null)}><X size={20} /></button>
            <div className="attendance-icon-wrap">
              <UserCheck size={32} />
            </div>
            <div className="attendance-info">
              <div className="attendance-name">{attendanceTarget.customerName}</div>
              <div className="attendance-meta">
                <span>{attendanceTarget.pax} pax</span>
                <span className="attendance-dot">·</span>
                <span>{attendanceTarget.activityType || "—"}</span>
                <span className="attendance-dot">·</span>
                <span className={`src-badge src-${attendanceTarget.source.toLowerCase()}`}>{attendanceTarget.source}</span>
              </div>
            </div>
            <p className="attendance-question">Este cliente compareceu?</p>
            <div className="attendance-actions">
              <button className="btn-ghost" onClick={() => setAttendanceTarget(null)}>Cancelar</button>
              <button
                className="btn-attendance-confirm"
                disabled={attendanceSaving}
                onClick={() => handleAttendance(attendanceTarget)}
              >
                <UserCheck size={16} />
                {attendanceSaving ? "A guardar..." : "Sim, compareceu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
