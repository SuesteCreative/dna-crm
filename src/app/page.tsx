"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  RefreshCcw,
  Plus,
  Search,
  CheckCircle,
  Clock,
  ExternalLink,
  X,
  Download,
  FileText
} from "lucide-react";
import { exportToExcel, exportToPDF } from "@/lib/export";
import "./Dashboard.css";

interface Booking {
  id: string;
  customerName: string;
  activityDate: string;
  activityTime: string | null;
  pax: number;
  status: string;
  source: string;
  totalPrice: number | null;
}

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    activityDate: "",
    activityTime: "",
    pax: 1,
    totalPrice: ""
  });

  useEffect(() => {
    if (isSignedIn) {
      fetchBookings();
    }
  }, [isSignedIn]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      if (res.ok) {
        await fetchBookings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        fetchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div className="dashboard">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <h2>DNA CRM</h2>
        </div>
        <ul className="nav-links">
          <li className="active"><Calendar size={20} /> Dashboard</li>
          <li><Users size={20} /> Parceiros</li>
          <li><RefreshCcw size={20} /> Sincronizar</li>
        </ul>
        <div className="sidebar-footer">
          <div className="user-profile-clerk">
            <UserButton afterSignOutUrl="/sign-in" showName />
          </div>
        </div>
      </nav>

      <main className="content">
        <header className="content-header">
          <div className="header-title">
            <h1>Reservas</h1>
            <p>Gerencie todas as atividades e agendamentos.</p>
          </div>
          <div className="header-actions">
            <button className="secondary-btn" onClick={() => exportToExcel(bookings, "reservas-dna")}>
              <Download size={18} /> Excel
            </button>
            <button className="secondary-btn" onClick={() => exportToPDF(bookings, "reservas-dna")}>
              <FileText size={18} /> PDF
            </button>
            <button className="secondary-btn" onClick={handleSync} disabled={syncing}>
              <RefreshCcw size={18} className={syncing ? "spin" : ""} /> {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
            </button>
            <button className="primary-btn" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Nova Reserva
            </button>
          </div>
        </header>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Nova Reserva Manual</h2>
                <button onClick={() => setShowModal(false)}><X /></button>
              </div>
              <form onSubmit={handleCreateBooking}>
                <div className="form-grid">
                  <div className="input-group">
                    <label>Nome do Cliente</label>
                    <input type="text" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>Email</label>
                    <input type="email" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Data</label>
                    <input type="date" value={formData.activityDate} onChange={e => setFormData({ ...formData, activityDate: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>Hora</label>
                    <input type="time" value={formData.activityTime} onChange={e => setFormData({ ...formData, activityTime: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Pax</label>
                    <input type="number" value={formData.pax} onChange={e => setFormData({ ...formData, pax: parseInt(e.target.value) })} required min="1" />
                  </div>
                  <div className="input-group">
                    <label>Preço (€)</label>
                    <input type="number" step="0.01" value={formData.totalPrice} onChange={e => setFormData({ ...formData, totalPrice: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="primary-btn full-width">Criar Reserva</button>
              </form>
            </div>
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><Calendar /></div>
            <div className="stat-info">
              <h3>{bookings.length}</h3>
              <p>Total Mensal</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle /></div>
            <div className="stat-info">
              <h3>{bookings.filter((b: Booking) => b.status === "CONFIRMED").length}</h3>
              <p>Confirmadas</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange"><Clock /></div>
            <div className="stat-info">
              <h3>{bookings.filter((b: Booking) => b.status === "PENDING").length}</h3>
              <p>Pendentes</p>
            </div>
          </div>
        </section>

        <section className="data-section">
          <div className="section-header">
            <h2>Reservas Recentes</h2>
            <div className="search-bar">
              <Search size={18} />
              <input type="text" placeholder="Procurar reserva..." />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Data/Hora</th>
                  <th>Pax</th>
                  <th>Fonte</th>
                  <th>Status</th>
                  <th>Preço</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center">A carregar...</td></tr>
                ) : bookings.length === 0 ? (
                  <tr><td colSpan={7} className="text-center">Nenhuma reserva encontrada.</td></tr>
                ) : (
                  bookings.map((booking: Booking) => (
                    <tr key={booking.id}>
                      <td>{booking.customerName}</td>
                      <td>
                        {new Date(booking.activityDate).toLocaleDateString()}
                        <br />
                        <span className="small">{booking.activityTime || "N/A"}</span>
                      </td>
                      <td>{booking.pax}</td>
                      <td><span className={`badge-source ${booking.source.toLowerCase()}`}>{booking.source}</span></td>
                      <td><span className={`badge-status ${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                      <td>{booking.totalPrice?.toFixed(2)}€</td>
                      <td><button className="icon-btn"><ExternalLink size={16} /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
