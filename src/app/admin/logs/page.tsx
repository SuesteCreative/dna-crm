"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { Shield, RefreshCcw, Filter } from "lucide-react";
import "./logs.css";

interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    module: string;
    targetId: string | null;
    targetName: string | null;
    details: string | null;
    createdAt: string;
}

export default function LogsReservasPage() {
    const { isLoaded, userId, sessionClaims } = useAuth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    const [moduleFilter, setModuleFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchLogs = useCallback(async () => {
        if (!userId || !isAdmin) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (moduleFilter) params.append("module", moduleFilter);
            if (actionFilter) params.append("action", actionFilter);
            if (userSearch) params.append("user", userSearch);
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);

            const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
            if (res.ok) setLogs(await res.json());
        } catch { }
        finally { setLoading(false); }
    }, [userId, isAdmin, moduleFilter, actionFilter, userSearch, startDate, endDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    if (!isLoaded) return <div className="logs-loading"><div className="loader" /></div>;
    if (!userId) return <RedirectToSignIn />;
    if (!isAdmin) return <div className="logs-forbidden">Acesso restrito a administradores.</div>;

    return (
        <main className="logs-main">
            <header className="logs-header" style={{ flexWrap: "wrap", gap: 16 }}>
                <div>
                    <h1 className="logs-title"><Shield size={20} /> Logs Reservas</h1>
                    <p className="logs-sub">Registo de alterações a reservas e ocupação de lugares da dashboard e concessão.</p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button className="logs-refresh" onClick={fetchLogs} disabled={loading}>
                        <RefreshCcw size={15} className={loading ? "spin" : ""} /> Atualizar
                    </button>
                </div>
            </header>

            <div className="logs-filters" style={{ display: "flex", gap: 12, padding: "0 20px 20px", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Filter size={14} /> Filtros:
                </span>

                <input
                    type="date"
                    className="au-search"
                    style={{ padding: "6px 10px" }}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    title="Data inicial"
                />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>até</span>
                <input
                    type="date"
                    className="au-search"
                    style={{ padding: "6px 10px" }}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    title="Data final"
                />

                <input
                    type="text"
                    placeholder="Procurar utilizador..."
                    className="au-search"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                />

                <select className="au-select" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
                    <option value="">Todos os Módulos</option>
                    <option value="DASHBOARD">Dashboard</option>
                    <option value="CONCESSION_ENTRY">Concessão (Lugares)</option>
                    <option value="CONCESSION_RESERVATION">Concessão (Reservas)</option>
                </select>

                <select className="au-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                    <option value="">Todas as Ações</option>
                    <option value="CREATE">CREATE</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="CANCEL">CANCEL</option>
                    <option value="DELETE">DELETE</option>
                    <option value="RELEASE">RELEASE</option>
                    <option value="OVERRIDE">OVERRIDE</option>
                </select>
            </div>

            {loading ? (
                <div className="logs-empty"><div className="loader-sm" /></div>
            ) : logs.length === 0 ? (
                <div className="logs-empty">Sem registos encontrados.</div>
            ) : (
                <div className="logs-table-wrap">
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Data/Hora</th>
                                <th>Utilizador</th>
                                <th>Módulo</th>
                                <th>Ação</th>
                                <th>Alvo</th>
                                <th>Detalhes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString("pt-PT")}</td>
                                    <td><span className="log-user">{log.userName}</span></td>
                                    <td><span className={`status-badge ${log.module === "DASHBOARD" ? "active" : "afternoon"}`}>{log.module === "DASHBOARD" ? "Dashboard" : "Concessão"}</span></td>
                                    <td><span className={`status-badge-sm ${log.action === "CREATE" ? "active" : log.action === "DELETE" || log.action === "CANCEL" ? "cancelled" : "morning"}`}>{log.action}</span></td>
                                    <td>{log.targetName || log.targetId || "—"}</td>
                                    <td className="log-reason" style={{ maxWidth: 300 }}>{log.details ? log.details.substring(0, 100) + (log.details.length > 100 ? "..." : "") : "N/A"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
