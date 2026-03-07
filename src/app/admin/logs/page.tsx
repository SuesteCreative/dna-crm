"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Shield, RefreshCcw } from "lucide-react";
import "./logs.css";

interface OverrideLog {
    id: string;
    bookingId: string;
    clerkUserId: string;
    userName: string;
    reason: string;
    serviceId: string | null;
    serviceName: string | null;
    slotTime: string;
    date: string;
    createdAt: string;
}

export default function OverrideLogsPage() {
    const { isLoaded, userId, sessionClaims } = useAuth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

    const [logs, setLogs] = useState<OverrideLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId && isAdmin) fetchLogs();
    }, [userId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/override-logs");
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
                    <h1 className="logs-title"><Shield size={20} /> Logs de Override</h1>
                    <p className="logs-sub">Reservas criadas forçando um slot lotado.</p>
                </div>
                <button className="logs-refresh" onClick={fetchLogs} disabled={loading}>
                    <RefreshCcw size={15} className={loading ? "spin" : ""} /> Atualizar
                </button>
            </header>

            {loading ? (
                <div className="logs-empty"><div className="loader-sm" /></div>
            ) : logs.length === 0 ? (
                <div className="logs-empty">Sem overrides registados.</div>
            ) : (
                <div className="logs-table-wrap">
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Hora</th>
                                <th>Serviço</th>
                                <th>Utilizador</th>
                                <th>Motivo</th>
                                <th>Reserva</th>
                                <th>Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id}>
                                    <td>{new Date(log.date + "T00:00:00").toLocaleDateString("pt-PT")}</td>
                                    <td><span className="log-time">{log.slotTime}</span></td>
                                    <td>{log.serviceName || "—"}</td>
                                    <td>{log.userName}</td>
                                    <td className="log-reason">{log.reason}</td>
                                    <td><span className="log-booking-id">{log.bookingId}</span></td>
                                    <td>{new Date(log.createdAt).toLocaleString("pt-PT")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
