"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Shield, RefreshCcw } from "lucide-react";
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

    useEffect(() => {
        if (userId && isAdmin) fetchLogs();
    }, [userId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/audit-logs");
            if (res.ok) setLogs(await res.json());
        } catch { }
        finally { setLoading(false); }
    };

    if (!isLoaded) return <div className="logs-loading"><div className="loader" /></div>;
    if (!userId) return <RedirectToSignIn />;
    if (!isAdmin) return <div className="logs-forbidden">Acesso restrito a administradores.</div>;

    return (
        <main className="logs-main">
            <header className="logs-header">
                <div>
                    <h1 className="logs-title"><Shield size={20} /> Logs Reservas</h1>
                    <p className="logs-sub">Registo de alterações a reservas e ocupação de lugares da dashboard e concessão.</p>
                </div>
                <button className="logs-refresh" onClick={fetchLogs} disabled={loading}>
                    <RefreshCcw size={15} className={loading ? "spin" : ""} /> Atualizar
                </button>
            </header>

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
