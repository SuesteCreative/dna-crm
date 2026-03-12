"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    Users, Search, Plus, Download, Upload, RefreshCcw,
    Pencil, Trash2, CheckCircle, X, ChevronLeft, ChevronRight, MailX
} from "lucide-react";
import "./customers.css";

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    notes: string | null;
    source: string;
    optedOut: boolean;
    createdAt: string;
}

interface Toast { message: string; type: "success" | "error"; }

const COUNTRIES = [
    "Portugal", "Spain", "France", "Germany", "UK", "Netherlands",
    "Belgium", "Italy", "Brazil", "USA", "Other"
];

export default function CustomersPage() {
    const { sessionClaims, isLoaded } = useAuth();
    const router = useRouter();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;

    // List state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [countryFilter, setCountryFilter] = useState("");
    const [optedFilter, setOptedFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Stats
    const [stats, setStats] = useState({ total: 0, optedOut: 0, countries: 0 });

    // Modal
    const [modal, setModal] = useState<"add" | "edit" | "import" | null>(null);
    const [editing, setEditing] = useState<Customer | null>(null);
    const [form, setForm] = useState({ name: "", email: "", phone: "", country: "", notes: "", optedOut: false });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Import
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; total: number } | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync
    const [syncing, setSyncing] = useState(false);

    // Details
    const [detailCustomer, setDetailCustomer] = useState<(Customer & { bookings: any[] }) | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Toast
    const [toast, setToast] = useState<Toast | null>(null);

    const LIMIT = 50;

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (!isLoaded) return;
        if (role !== "ADMIN" && role !== "SUPER_ADMIN") { router.push("/"); return; }
    }, [isLoaded, role]);

    const fetchCustomers = useCallback(async (p = page) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
        if (search) params.set("search", search);
        if (countryFilter) params.set("country", countryFilter);
        if (optedFilter) params.set("optedOut", optedFilter);
        const r = await fetch(`/api/customers?${params}`);
        const data = await r.json();
        setCustomers(data.customers ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
    }, [page, search, countryFilter, optedFilter]);

    const fetchStats = useCallback(async () => {
        const [all, opted] = await Promise.all([
            fetch("/api/customers?limit=1").then(r => r.json()),
            fetch("/api/customers?optedOut=true&limit=1").then(r => r.json()),
        ]);
        // Countries: fetch all and count unique
        const full = await fetch("/api/customers?limit=9999").then(r => r.json());
        const uniqueCountries = new Set((full.customers as Customer[]).map(c => c.country).filter(Boolean));
        setStats({ total: all.total ?? 0, optedOut: opted.total ?? 0, countries: uniqueCountries.size });
    }, []);

    useEffect(() => {
        if (isLoaded && (role === "ADMIN" || role === "SUPER_ADMIN")) {
            fetchCustomers(1);
            fetchStats();
        }
    }, [isLoaded, role]);

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setPage(1);
            fetchCustomers(1);
        }, 300);
    }, [search, countryFilter, optedFilter]);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: "", email: "", phone: "", country: "", notes: "", optedOut: false });
        setFormError(null);
        setModal("add");
    };

    const openEdit = (c: Customer) => {
        setEditing(c);
        setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", country: c.country ?? "", notes: c.notes ?? "", optedOut: c.optedOut });
        setFormError(null);
        setModal("edit");
    };

    const handleSave = async () => {
        if (!form.name.trim()) { setFormError("Nome é obrigatório."); return; }
        setSaving(true);
        setFormError(null);
        const body = { name: form.name.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null, country: form.country || null, notes: form.notes.trim() || null, optedOut: form.optedOut };
        const url = modal === "edit" && editing ? `/api/customers/${editing.id}` : "/api/customers";
        const method = modal === "edit" ? "PUT" : "POST";
        const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) { setFormError(data.error ?? "Erro ao guardar."); setSaving(false); return; }
        setSaving(false);
        setModal(null);
        showToast(modal === "edit" ? "Cliente atualizado." : "Cliente criado.");
        fetchCustomers(page);
        fetchStats();
    };

    const handleDelete = async (c: Customer) => {
        if (!confirm(`Eliminar "${c.name}"? Esta acção não pode ser desfeita.`)) return;
        const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
        if (res.ok) { showToast("Cliente eliminado."); fetchCustomers(page); fetchStats(); }
        else showToast("Erro ao eliminar.", "error");
    };

    const handleSync = async () => {
        setSyncing(true);
        const res = await fetch("/api/customers/sync", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
            showToast(`Sincronizado: ${data.created} novos, ${data.updated} atualizados.`);
            fetchCustomers(1);
            fetchStats();
        } else {
            showToast("Erro ao sincronizar.", "error");
        }
        setSyncing(false);
    };

    const handleExport = () => {
        window.open("/api/customers/export", "_blank");
    };

    const handleImport = async () => {
        if (!importFile) return;
        setImporting(true);
        setImportResult(null);
        const fd = new FormData();
        fd.append("file", importFile);
        const res = await fetch("/api/customers/import", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) {
            setImportResult(data);
            fetchCustomers(1);
            fetchStats();
        } else {
            showToast(data.error ?? "Erro ao importar.", "error");
            setModal(null);
        }
        setImporting(false);
    };

    const openImport = () => {
        setImportFile(null);
        setImportResult(null);
        setModal("import");
    };

    const fetchCustomerDetail = async (id: string) => {
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/customers/${id}`);
            if (res.ok) {
                const data = await res.json();
                setDetailCustomer(data);
            }
        } catch { }
        finally { setDetailLoading(false); }
    };

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="cust-page">
            {/* Header */}
            <div className="cust-header">
                <div>
                    <h1 className="cust-title"><Users size={22} /> Base de Clientes</h1>
                    <p className="cust-sub">Gestão de contactos e histórico de clientes.</p>
                </div>
                <div className="cust-actions">
                    <button className="cust-btn cust-btn-sec" onClick={handleSync} disabled={syncing}>
                        <RefreshCcw size={14} className={syncing ? "spin" : ""} />
                        {syncing ? "A sincronizar..." : "Sync Shopify"}
                    </button>
                    <button className="cust-btn cust-btn-sec" onClick={openImport}>
                        <Upload size={14} /> Importar
                    </button>
                    <button className="cust-btn cust-btn-sec" onClick={handleExport}>
                        <Download size={14} /> Exportar
                    </button>
                    <button className="cust-btn cust-btn-primary" onClick={openAdd}>
                        <Plus size={14} /> Novo Cliente
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="cust-stats">
                <div className="cust-stat">
                    <div className="cust-stat-val">{stats.total.toLocaleString("pt-PT")}</div>
                    <div className="cust-stat-lbl">Total de clientes</div>
                </div>
                <div className="cust-stat">
                    <div className="cust-stat-val">{stats.optedOut}</div>
                    <div className="cust-stat-lbl">Opt-out marketing</div>
                </div>
                <div className="cust-stat">
                    <div className="cust-stat-val">{stats.countries}</div>
                    <div className="cust-stat-lbl">Países distintos</div>
                </div>
            </div>

            {/* Filters */}
            <div className="cust-filters">
                <div className="cust-search">
                    <Search size={14} color="var(--muted)" />
                    <input
                        placeholder="Pesquisar por nome, email ou telefone..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={13} /></button>}
                </div>
                <select className="cust-filter-select" value={countryFilter} onChange={e => setCountryFilter(e.target.value)}>
                    <option value="">Todos os países</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="cust-filter-select" value={optedFilter} onChange={e => setOptedFilter(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="false">Marketing ativo</option>
                    <option value="true">Opt-out</option>
                </select>
            </div>

            {/* Table */}
            <div className="cust-table-wrap">
                <table className="cust-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>País</th>
                            <th>Origem</th>
                            <th>Marketing</th>
                            <th>Registado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan={8} className="cust-empty">A carregar...</td></tr>
                        )}
                        {!loading && customers.length === 0 && (
                            <tr><td colSpan={8} className="cust-empty">Nenhum cliente encontrado.</td></tr>
                        )}
                        {customers.map(c => (
                            <tr key={c.id} onClick={() => fetchCustomerDetail(c.id)} style={{ cursor: "pointer" }}>
                                <td><strong>{c.name}</strong></td>
                                <td style={{ color: "var(--muted)" }}>{c.email ?? "—"}</td>
                                <td style={{ color: "var(--muted)" }}>{c.phone ?? "—"}</td>
                                <td>{c.country ?? "—"}</td>
                                <td><span className="cust-source-badge">{c.source}</span></td>
                                <td>
                                    {c.optedOut ? (
                                        <span className="cust-opted-badge"><MailX size={10} /> Opt-out</span>
                                    ) : (
                                        <span style={{ color: "var(--green)", fontSize: "0.8rem" }}>✓ Ativo</span>
                                    )}
                                </td>
                                <td style={{ color: "var(--muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                                    {new Date(c.createdAt).toLocaleDateString("pt-PT")}
                                </td>
                                <td>
                                    <div className="cust-row-actions" onClick={e => e.stopPropagation()}>
                                        <button className="cust-icon-btn" title="Editar" onClick={() => openEdit(c)}><Pencil size={13} /></button>
                                        <button className="cust-icon-btn danger" title="Eliminar" onClick={() => handleDelete(c)}><Trash2 size={13} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="cust-pagination">
                        <span>{((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} de {total}</span>
                        <div className="cust-pages">
                            <button className="cust-page-btn" onClick={() => { setPage(p => p - 1); fetchCustomers(page - 1); }} disabled={page === 1}>
                                <ChevronLeft size={13} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                                return (
                                    <button key={p} className={`cust-page-btn${p === page ? " active" : ""}`} onClick={() => { setPage(p); fetchCustomers(p); }}>{p}</button>
                                );
                            })}
                            <button className="cust-page-btn" onClick={() => { setPage(p => p + 1); fetchCustomers(page + 1); }} disabled={page === totalPages}>
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(modal === "add" || modal === "edit") && (
                <div className="cust-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
                    <div className="cust-modal">
                        <div className="cust-modal-hdr">
                            <div className="cust-modal-title">{modal === "edit" ? "Editar Cliente" : "Novo Cliente"}</div>
                            <button className="cust-modal-close" onClick={() => setModal(null)}><X size={18} /></button>
                        </div>
                        <div className="cust-form">
                            <div className="cust-field">
                                <label>Nome *</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
                            </div>
                            <div className="cust-field">
                                <label>Email</label>
                                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
                            </div>
                            <div className="cust-field">
                                <label>Telefone</label>
                                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+351 9xx xxx xxx" />
                            </div>
                            <div className="cust-field">
                                <label>País</label>
                                <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                                    <option value="">Selecionar país</option>
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="cust-field">
                                <label>Notas</label>
                                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas internas..." />
                            </div>
                            <div className="cust-opt-row">
                                <input type="checkbox" id="optedOut" checked={form.optedOut} onChange={e => setForm(f => ({ ...f, optedOut: e.target.checked }))} />
                                <label htmlFor="optedOut">Opt-out de emails de marketing</label>
                            </div>
                            {formError && <div style={{ color: "#fca5a5", fontSize: "0.85rem" }}>{formError}</div>}
                            <div className="cust-modal-footer">
                                <button className="cust-btn cust-btn-sec" onClick={() => setModal(null)}>Cancelar</button>
                                <button className="cust-btn cust-btn-primary" onClick={handleSave} disabled={saving}>
                                    {saving ? "A guardar..." : modal === "edit" ? "Guardar" : "Criar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {modal === "import" && (
                <div className="cust-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
                    <div className="cust-modal">
                        <div className="cust-modal-hdr">
                            <div className="cust-modal-title">Importar Clientes (Excel)</div>
                            <button className="cust-modal-close" onClick={() => setModal(null)}><X size={18} /></button>
                        </div>
                        <div className="cust-form">
                            <p style={{ fontSize: "0.82rem", color: "var(--muted)", margin: 0 }}>
                                O ficheiro deve ter uma linha de cabeçalho com as colunas: <strong>Nome</strong>, Email, Telefone, País, Notas, Opt-out.<br />
                                Apenas a coluna Nome é obrigatória. Registos existentes por email/telefone serão atualizados.
                            </p>

                            {!importResult ? (
                                <div
                                    className={`cust-import-zone${dragOver ? " drag-over" : ""}`}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setImportFile(f); }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={24} style={{ margin: "0 auto 0.5rem", display: "block" }} />
                                    {importFile ? importFile.name : "Arraste o ficheiro .xlsx aqui ou clique para selecionar"}
                                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                                </div>
                            ) : (
                                <div className="cust-import-result">
                                    <div className="ok"><CheckCircle size={14} style={{ marginRight: 4 }} />Importação concluída</div>
                                    <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text)" }}>
                                        <div>✓ {importResult.created} novos clientes criados</div>
                                        <div>↻ {importResult.updated} atualizados</div>
                                        <div className="warn">⚠ {importResult.skipped} ignorados (duplicados ou erros)</div>
                                        <div style={{ marginTop: "0.35rem", color: "var(--muted)" }}>Total processado: {importResult.total} linhas</div>
                                    </div>
                                </div>
                            )}

                            <div className="cust-modal-footer">
                                <button className="cust-btn cust-btn-sec" onClick={() => setModal(null)}>{importResult ? "Fechar" : "Cancelar"}</button>
                                {!importResult && (
                                    <button className="cust-btn cust-btn-primary" onClick={handleImport} disabled={!importFile || importing}>
                                        {importing ? "A importar..." : "Importar"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {detailCustomer && (
                <div className="cust-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setDetailCustomer(null); }}>
                    <div className="cust-modal detail-modal">
                        <div className="cust-modal-hdr">
                            <div className="cust-modal-title">Detalhes do Cliente</div>
                            <button className="cust-modal-close" onClick={() => setDetailCustomer(null)}><X size={18} /></button>
                        </div>
                        <div className="detail-content">
                            <div className="detail-header">
                                <div className="detail-avatar">{detailCustomer.name.charAt(0)}</div>
                                <div>
                                    <div className="detail-name">{detailCustomer.name}</div>
                                    <div className="detail-sub">{detailCustomer.email || "Sem email"}</div>
                                </div>
                            </div>

                            <div className="detail-stats-grid">
                                <div className="detail-mini-stat">
                                    <div className="lbl">Reservas</div>
                                    <div className="val">{detailCustomer.bookings.length}</div>
                                </div>
                                <div className="detail-mini-stat">
                                    <div className="lbl">Total Gasto</div>
                                    <div className="val">
                                        {detailCustomer.bookings
                                            .filter(b => b.status !== "CANCELLED")
                                            .reduce((acc, b) => acc + (b.totalPrice || 0), 0)
                                            .toFixed(2)}€
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <div className="detail-section-title">Histórico de Atividades</div>
                                <div className="detail-bookings-list">
                                    {detailCustomer.bookings.length === 0 ? (
                                        <div className="empty-text">Sem reservas registadas.</div>
                                    ) : (
                                        detailCustomer.bookings.map(b => (
                                            <div key={b.id} className={`detail-booking-item ${b.status.toLowerCase()}`}>
                                                <div className="bk-date">
                                                    {new Date(b.activityDate).toLocaleDateString("pt-PT")}
                                                </div>
                                                <div className="bk-type">{b.activityType || "Atividade"}</div>
                                                <div className="bk-status">{b.status}</div>
                                                <div className="bk-price">{b.totalPrice?.toFixed(2)}€</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`cust-toast ${toast.type}`}>
                    {toast.type === "success" ? <CheckCircle size={15} /> : <X size={15} />}
                    {toast.message}
                </div>
            )}
        </div>
    );
}
