"use client";

import React from "react";
import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { Shield, RefreshCcw, Filter, ChevronDown, ChevronRight, Mail, AlertCircle } from "lucide-react";
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

function LogDetails({ details }: { details: string | null }) {
    if (!details) return <div className="details-container"><span className="detail-value">—</span></div>;

    try {
        const data = JSON.parse(details);
        // If it's just a string, it will throw or return a string
        if (typeof data !== 'object') throw new Error();

        const entries = Object.entries(data);

        return (
            <div className="details-container">
                <div className="details-grid">
                    {entries.map(([key, value]: [string, any]) => {
                        const label = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase())
                            .replace('Service Id', 'Serviço')
                            .replace('Customer Name', 'Cliente')
                            .replace('Activity Date', 'Data')
                            .replace('Activity Time', 'Hora')
                            .replace('Total Price', 'Preço')
                            .replace('Pax', 'Pessoas');

                        let displayValue = String(value);
                        if (key.toLowerCase().includes('date')) {
                            try { displayValue = new Date(value).toLocaleDateString('pt-PT'); } catch { }
                        }
                        if (key.toLowerCase().includes('price')) {
                            displayValue = `${Number(value).toFixed(2)}€`;
                        }

                        return (
                            <div key={key} className="detail-block">
                                <span className="detail-label">{label}</span>
                                <span className={`detail-value ${label.toLowerCase().includes('email') && displayValue.includes('@') ? 'email-highlight' : ''}`}>
                                    {displayValue}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className="detail-json">
                    <span className="detail-label" style={{ opacity: 0.5, marginBottom: 8, display: 'block' }}>Dados Técnicos (JSON)</span>
                    <code>{details}</code>
                </div>
            </div>
        );
    } catch {
        return <div className="details-container"><span className="detail-value">{details}</span></div>;
    }
}

export default function LogsReservasPage() {
    const { isLoaded, userId, sessionClaims } = useAuth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const [moduleFilter, setModuleFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleting, setDeleting] = useState(false);

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
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
                setSelectedIds(new Set());
            }
        } catch { }
        finally { setLoading(false); }
    }, [userId, isAdmin, moduleFilter, actionFilter, userSearch, startDate, endDate]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const toggleSelectAll = () => {
        if (selectedIds.size === logs.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(logs.map(l => l.id)));
    };

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Eliminar ${selectedIds.size} registos permanentemente?`)) return;

        setDeleting(true);
        try {
            const res = await fetch("/api/admin/audit-logs/delete", {
                method: "DELETE",
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });
            if (res.ok) {
                setLogs(prev => prev.filter(l => !selectedIds.has(l.id)));
                setSelectedIds(new Set());
            } else {
                alert("Erro ao eliminar registos.");
            }
        } catch {
            alert("Erro de ligação.");
        } finally {
            setDeleting(false);
        }
    };

    const toggleRow = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedRows(newSet);
    };

    if (!isLoaded) return <div className="logs-loading"><div className="loader" /></div>;
    if (!userId) return <RedirectToSignIn />;
    if (!isAdmin) return <div className="logs-forbidden">Acesso restrito a administradores.</div>;

    return (
        <main className="logs-main">
            <header className="logs-header">
                <div>
                    <h1 className="logs-title"><Shield size={22} className="text-secondary" /> Logs Reservas</h1>
                    <p className="logs-sub">Registo de alterações a reservas e ocupação de lugares.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    {role === "SUPER_ADMIN" && selectedIds.size > 0 && (
                        <button className="logs-delete-bulk" onClick={handleDeleteSelected} disabled={deleting}>
                            {deleting ? <RefreshCcw size={14} className="spin" /> : <AlertCircle size={14} />}
                            Eliminar ({selectedIds.size})
                        </button>
                    )}
                    <button className="logs-refresh" onClick={fetchLogs} disabled={loading}>
                        <RefreshCcw size={15} className={loading ? "spin" : ""} /> Atualizar
                    </button>
                </div>
            </header>

            <div className="logs-filters-bar">
                <div className="filters-section">
                    <span className="filter-title"><Filter size={14} /> Filtros:</span>

                    <div className="date-inputs">
                        <input type="date" className="au-search" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        <span className="date-sep">até</span>
                        <input type="date" className="au-search" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>

                    <input
                        type="text"
                        placeholder="Procurar utilizador ou alvo..."
                        className="au-search search-input"
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                    />

                    <select className="au-select" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
                        <option value="">Todos os Módulos</option>
                        <option value="CONCESSION_ENTRY">Concessão (Lugares)</option>
                        <option value="CONCESSION_RESERVATION">Concessão (Reservas)</option>
                        <option value="SHOPIFY">Shopify Sync</option>
                        <option value="GCAL">GCal Sync</option>
                    </select>

                    <select className="au-select" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                        <option value="">Todas as Ações</option>
                        <option value="CREATE">CREATE</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="EMAIL_SENT">EMAIL_SENT</option>
                        <option value="EMAIL_ERROR">EMAIL_ERROR</option>
                        <option value="CANCEL">CANCEL</option>
                        <option value="DELETE">DELETE</option>
                        <option value="SYNC">SYNC</option>
                    </select>
                </div>
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
                                <th style={{ width: 40 }}>
                                    <input
                                        type="checkbox"
                                        className="log-checkbox"
                                        checked={logs.length > 0 && selectedIds.size === logs.length}
                                        onChange={toggleSelectAll}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </th>
                                <th style={{ width: 40 }}></th>
                                <th>Data/Hora</th>
                                <th>Utilizador</th>
                                <th>Módulo</th>
                                <th>Ação</th>
                                <th>Alvo</th>
                                <th>Informação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => {
                                const isExpanded = expandedRows.has(log.id);
                                const isEmail = log.action.startsWith('EMAIL_');

                                return (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            onClick={(e) => toggleRow(log.id, e)}
                                            className={`log-row ${isExpanded ? 'active' : ''} ${selectedIds.has(log.id) ? 'selected' : ''}`}
                                        >
                                            <td className="check-cell" onClick={e => toggleSelect(log.id, e)}>
                                                <input
                                                    type="checkbox"
                                                    className="log-checkbox"
                                                    checked={selectedIds.has(log.id)}
                                                    readOnly
                                                />
                                            </td>
                                            <td className="expand-cell">
                                                <div className={`chevron ${isExpanded ? 'rotated' : ''}`}>
                                                    <ChevronRight size={14} />
                                                </div>
                                            </td>
                                            <td className="time-cell">
                                                <span className="date">{new Date(log.createdAt).toLocaleDateString("pt-PT")}</span>
                                                <span className="time">{new Date(log.createdAt).toLocaleTimeString("pt-PT", { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td><span className="user-pill">{log.userName}</span></td>
                                            <td>
                                                <span className={`mod-badge ${log.module.toLowerCase()}`}>
                                                    {log.module === "DASHBOARD" ? "Dashboard" :
                                                        log.module === "BOOKING" ? "Emails" :
                                                        log.module === "SHOPIFY" ? "Shopify" :
                                                        log.module === "GCAL" ? "GCal" : "Concessão"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`action-badge ${log.action.toLowerCase()}`}>
                                                    {isEmail ? (log.action === "EMAIL_SENT" ? <Mail size={10} /> : <AlertCircle size={10} />) : null}
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="target-cell">{log.targetName || log.targetId || "—"}</td>
                                            <td className="summary-cell">
                                                {log.details ? (
                                                    <span className="detail-preview text-truncate">
                                                        {log.details.length > 60 ? log.details.substring(0, 60) + "..." : log.details}
                                                    </span>
                                                ) : "—"}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="details-row">
                                                <td colSpan={8}>
                                                    <LogDetails details={log.details} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}
