"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  Calendar, Users, RefreshCcw, Plus, Search,
  CheckCircle, Clock, X, Download, FileText,
  TrendingUp, Activity, ShoppingBag, LayoutDashboard,
  ChevronRight, AlertCircle
} from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";
import "./Dashboard.css";

interface Booking {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  activityDate: string;
  activityTime: string | null;
  pax: number;
  status: string;
  source: string;
  totalPrice: number | null;
  notes?: string;
}

const defaultForm = {
  customerName: "", customerEmail: "", customerPhone: "",
  activityDate: "", activityTime: "", pax: 1, totalPrice: ""
};

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [formData, setFormData] = useState(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) fetchBookings();
  }, [isSignedIn]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(bookings.filter(b =>
      b.customerName.toLowerCase().includes(q) ||
      (b.customerEmail || "").toLowerCase().includes(q)
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

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg(`Sincronizado: ${data.count ?? 0} reservas importadas`);
        await fetchBookings();
      } else {
        setSyncMsg(`Erro: ${data.error || "Sync falhou"}`);
      }
    } catch { setSyncMsg("Erro de ligação"); }
    finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData(defaultForm);
        fetchBookings();
      } else {
        const d = await res.json();
        setFormError(d.error || "Erro ao criar reserva");
      }
    } catch { setFormError("Erro de ligação"); }
  };

  const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;
  const pending = bookings.filter(b => b.status === "PENDING").length;
  const revenue = bookings.reduce((s, b) => s + (b.totalPrice || 0), 0);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      CONFIRMED: "badge-confirmed", PENDING: "badge-pending", CANCELLED: "badge-cancelled"
    };
    const label: Record<string, string> = {
      CONFIRMED: "Confirmada", PENDING: "Pendente", CANCELLED: "Cancelada"
    };
    return <span className={`badge ${map[s] || "badge-pending"}`}>{label[s] || s}</span>;
  };

  const sourceBadge = (s: string) => {
    const map: Record<string, string> = {
      SHOPIFY: "src-shopify", MANUAL: "src-manual", PARTNER: "src-partner"
    };
    return <span className={`src-badge ${map[s] || "src-manual"}`}>{s}</span>;
  };

  if (!isLoaded || !isSignedIn) return (
    <div className="loading-screen">
      <div className="loader" />
    </div>
  );

  return (
    <div className="crm-root">
      {/* Sidebar */}
      <aside className="crm-sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={20} />
          </div>
          <span className="brand-name">DNA CRM</span>
        </div>

        <nav className="crm-nav">
          <p className="nav-label">Principal</p>
          <button className={`nav-item ${activeNav === "dashboard" ? "active" : ""}`} onClick={() => setActiveNav("dashboard")}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
            {activeNav === "dashboard" && <ChevronRight size={14} className="nav-arrow" />}
          </button>
          <button className={`nav-item ${activeNav === "partners" ? "active" : ""}`} onClick={() => setActiveNav("partners")}>
            <Users size={18} />
            <span>Parceiros</span>
            {activeNav === "partners" && <ChevronRight size={14} className="nav-arrow" />}
          </button>
          <p className="nav-label">Integrações</p>
          <button className={`nav-item ${activeNav === "shopify" ? "active" : ""}`} onClick={() => { setActiveNav("shopify"); handleSync(); }}>
            <ShoppingBag size={18} />
            <span>Shopify</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <UserButton afterSignOutUrl="/sign-in" showName />
        </div>
      </aside>

      {/* Main area */}
      <main className="crm-main">

        {/* Top bar */}
        <header className="crm-topbar">
          <div>
            <h1 className="page-title">Reservas</h1>
            <p className="page-sub">Gerencie todas as atividades e agendamentos.</p>
          </div>
          <div className="topbar-actions">
            <button className="btn-ghost" onClick={() => exportToExcel(bookings, "reservas-dna")}>
              <Download size={16} /> Excel
            </button>
            <button className="btn-ghost" onClick={() => exportToPDF(bookings, "reservas-dna")}>
              <FileText size={16} /> PDF
            </button>
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

        {/* Stats */}
        <section className="stats-row">
          <div className="stat-tile blue">
            <div className="tile-ico"><Calendar size={22} /></div>
            <div className="tile-info">
              <span className="tile-val">{bookings.length}</span>
              <span className="tile-lbl">Total de Reservas</span>
            </div>
            <TrendingUp size={40} className="tile-bg-ico" />
          </div>
          <div className="stat-tile green">
            <div className="tile-ico"><CheckCircle size={22} /></div>
            <div className="tile-info">
              <span className="tile-val">{confirmed}</span>
              <span className="tile-lbl">Confirmadas</span>
            </div>
            <CheckCircle size={40} className="tile-bg-ico" />
          </div>
          <div className="stat-tile amber">
            <div className="tile-ico"><Clock size={22} /></div>
            <div className="tile-info">
              <span className="tile-val">{pending}</span>
              <span className="tile-lbl">Pendentes</span>
            </div>
            <Clock size={40} className="tile-bg-ico" />
          </div>
          <div className="stat-tile teal">
            <div className="tile-ico"><Activity size={22} /></div>
            <div className="tile-info">
              <span className="tile-val">{revenue.toFixed(0)}€</span>
              <span className="tile-lbl">Receita Total</span>
            </div>
            <TrendingUp size={40} className="tile-bg-ico" />
          </div>
        </section>

        {/* Table */}
        <section className="table-card">
          <div className="table-card-header">
            <h2>Reservas Recentes</h2>
            <div className="search-wrap">
              <Search size={16} className="search-icon" />
              <input
                className="search-input"
                placeholder="Pesquisar cliente ou email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Data / Hora</th>
                  <th>Pax</th>
                  <th>Fonte</th>
                  <th>Status</th>
                  <th>Preço</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="table-empty"><div className="loader-sm" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="table-empty">Nenhuma reserva encontrada.</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div className="cell-name">{b.customerName}</div>
                      <div className="cell-sub">{b.customerEmail || "—"}</div>
                    </td>
                    <td>
                      <div className="cell-name">{new Date(b.activityDate).toLocaleDateString("pt-PT")}</div>
                      <div className="cell-sub">{b.activityTime || "—"}</div>
                    </td>
                    <td><span className="pax-pill">{b.pax} pax</span></td>
                    <td>{sourceBadge(b.source)}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td className="price-cell">{b.totalPrice != null ? `${b.totalPrice.toFixed(2)}€` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal */}
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
                <div className="field full">
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
    </div>
  );
}
