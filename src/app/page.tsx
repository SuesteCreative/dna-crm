"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
    Calendar,
    Users,
    RefreshCcw,
    LogOut,
    Plus,
    Search,
    CheckCircle,
    Clock,
    ExternalLink
} from "lucide-react";

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
    const { data: session } = useSession();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/bookings");
            const data = await res.json();
            setBookings(data);
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
                    <div className="user-info">
                        <p>{session?.user?.name || "Admin"}</p>
                        <span>{session?.user?.email}</span>
                    </div>
                    <button onClick={() => signOut()} className="logout-btn">
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </nav>

            <main className="content">
                <header className="content-header">
                    <div className="header-title">
                        <h1>Reservas</h1>
                        <p>Gerencie todas as atividades e agendamentos.</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-btn" onClick={handleSync} disabled={syncing}>
                            <RefreshCcw size={18} className={syncing ? "spin" : ""} /> {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
                        </button>
                        <button className="primary-btn">
                            <Plus size={18} /> Nova Reserva
                        </button>
                    </div>
                </header>

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
                            <h3>{bookings.filter(b => b.status === "CONFIRMED").length}</h3>
                            <p>Confirmadas</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange"><Clock /></div>
                        <div className="stat-info">
                            <h3>{bookings.filter(b => b.status === "PENDING").length}</h3>
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
                                    bookings.map((booking) => (
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

            <style jsx>{`
        .dashboard {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
        }

        .sidebar {
          width: 260px;
          background: #001f3f;
          color: white;
          display: flex;
          flex-direction: column;
          padding: 2rem 1.5rem;
        }

        .sidebar-logo h2 {
          font-size: 1.5rem;
          margin-bottom: 2rem;
          color: #00aaff;
        }

        .nav-links {
          list-style: none;
          padding: 0;
          flex-grow: 1;
        }

        .nav-links li {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 0.5rem;
          opacity: 0.7;
        }

        .nav-links li:hover, .nav-links li.active {
          background: rgba(255, 255, 255, 0.1);
          opacity: 1;
          color: #00aaff;
        }

        .sidebar-footer {
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1.5rem;
        }

        .user-info p {
          margin: 0;
          font-weight: 600;
        }

        .user-info span {
          font-size: 0.8rem;
          opacity: 0.5;
        }

        .logout-btn {
          margin-top: 1rem;
          width: 100%;
          background: none;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.6rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .content {
          flex-grow: 1;
          padding: 2rem 3rem;
          overflow-y: auto;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .header-title h1 {
          font-size: 2rem;
          margin: 0;
        }

        .header-title p {
          color: #64748b;
          margin: 0.3rem 0;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .primary-btn, .secondary-btn {
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          border: none;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .primary-btn {
          background: #00aaff;
          color: white;
        }

        .secondary-btn {
          background: white;
          border: 1px solid #e2e8f0;
          color: #1e293b;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-icon.blue { background: #00aaff; }
        .stat-icon.green { background: #10b981; }
        .stat-icon.orange { background: #f59e0b; }

        .stat-info h3 {
          margin: 0;
          font-size: 1.5rem;
        }

        .stat-info p {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .data-section {
          background: white;
          padding: 2rem;
          border-radius: 24px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          background: #f1f5f9;
          padding: 0.6rem 1rem;
          border-radius: 12px;
          width: 300px;
        }

        .search-bar input {
          background: none;
          border: none;
          outline: none;
          width: 100%;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          text-align: left;
          padding: 1rem;
          color: #64748b;
          font-weight: 500;
          border-bottom: 1px solid #e2e8f0;
        }

        td {
          padding: 1.2rem 1rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .badge-source, .badge-status {
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-source.shopify { background: #ecfdf5; color: #059669; }
        .badge-source.manual { background: #eff6ff; color: #2563eb; }

        .badge-status.confirmed { background: #ecfdf5; color: #059669; }
        .badge-status.pending { background: #fffbeb; color: #d97706; }

        .small { font-size: 0.8rem; color: #94a3b8; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
