"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Search, Trash2, AlertTriangle, CheckCircle, User, Calendar, Umbrella } from "lucide-react";

export default function GdprPage() {
    const { user } = useUser();
    const role = (user?.publicMetadata as any)?.role;
    if (role !== "SUPER_ADMIN") {
        return <div style={{ padding: 40, color: "#ef4444" }}>Acesso negado.</div>;
    }

    return <GdprTool />;
}

function GdprTool() {
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [erasing, setErasing] = useState(false);
    const [done, setDone] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    const totalFound = results
        ? results.customers.length + results.bookings.length + results.entries.length +
          results.reservations.length + results.staffRequests.length
        : 0;

    const handleSearch = async () => {
        if (query.trim().length < 2) return;
        setSearching(true);
        setResults(null);
        setDone(null);
        setError(null);
        setConfirming(false);
        try {
            const res = await fetch(`/api/admin/gdpr?q=${encodeURIComponent(query.trim())}`);
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Erro na pesquisa"); return; }
            setResults(data);
        } catch {
            setError("Erro de rede. Tente novamente.");
        } finally {
            setSearching(false);
        }
    };

    const handleErase = async () => {
        setErasing(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/gdpr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ q: query.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? "Erro ao apagar"); return; }
            setDone(data.summary);
            setResults(null);
            setConfirming(false);
            setQuery("");
        } catch {
            setError("Erro de rede. Tente novamente.");
        } finally {
            setErasing(false);
        }
    };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px" }}>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 4 }}>
                Eliminação de Dados — RGPD
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 32 }}>
                Pesquise por nome, email ou telefone. Todos os dados pessoais identificáveis serão apagados permanentemente.
                Registos financeiros (reservas, entradas) são anonimizados mas mantidos por obrigação fiscal (7 anos).
            </p>

            {/* Search bar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setResults(null); setConfirming(false); setDone(null); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Nome, email ou telefone..."
                    style={{
                        flex: 1, padding: "10px 14px", borderRadius: 8,
                        border: "1px solid #e2e8f0", fontSize: "0.95rem", outline: "none",
                    }}
                />
                <button
                    onClick={handleSearch}
                    disabled={searching || query.trim().length < 2}
                    style={{
                        padding: "10px 20px", borderRadius: 8, border: "none",
                        background: "#3b82f6", color: "#fff", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                        opacity: searching || query.trim().length < 2 ? 0.5 : 1,
                    }}
                >
                    <Search size={16} /> {searching ? "A pesquisar..." : "Pesquisar"}
                </button>
            </div>

            {error && (
                <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", marginBottom: 16 }}>
                    {error}
                </div>
            )}

            {/* Success state */}
            {done && (
                <div style={{ padding: "20px 24px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <CheckCircle size={20} color="#16a34a" />
                        <strong style={{ color: "#15803d" }}>Dados eliminados com sucesso.</strong>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: "0.875rem", color: "#374151", lineHeight: 2 }}>
                        <li>Clientes anonimizados: <strong>{done.customersAnonymised}</strong></li>
                        <li>Reservas (atividades) anonimizadas: <strong>{done.bookingsAnonymised}</strong></li>
                        <li>Entradas concessão anonimizadas: <strong>{done.concessionEntriesAnonymised}</strong></li>
                        <li>Reservas concessão anonimizadas: <strong>{done.reservationsAnonymised}</strong></li>
                        <li>Pedidos de staff eliminados: <strong>{done.staffRequestsDeleted}</strong></li>
                    </ul>
                </div>
            )}

            {/* Results preview */}
            {results && !done && (
                <div>
                    {totalFound === 0 ? (
                        <div style={{ padding: "20px 24px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, color: "#64748b", textAlign: "center" }}>
                            Nenhum registo encontrado para "<strong>{query}</strong>".
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: 16, fontSize: "0.875rem", color: "#374151" }}>
                                Encontrados <strong>{totalFound} registos</strong> para "<strong>{query}</strong>":
                            </div>

                            {results.customers.length > 0 && (
                                <Section icon={<User size={15} />} title="Clientes" color="#7c3aed">
                                    {results.customers.map((c: any) => (
                                        <Row key={c.id} main={c.name} sub={[c.email, c.phone, c.country].filter(Boolean).join(" · ")} />
                                    ))}
                                </Section>
                            )}

                            {results.bookings.length > 0 && (
                                <Section icon={<Calendar size={15} />} title={`Reservas de atividades (${results.bookings.length}) — anonimizadas, não apagadas`} color="#0369a1" note="Obrigação fiscal">
                                    {results.bookings.map((b: any) => (
                                        <Row key={b.id} main={b.customerName} sub={`${b.activityType ?? "Atividade"} · ${new Date(b.activityDate).toLocaleDateString("pt-PT")} · ${b.totalPrice?.toFixed(2)}€`} />
                                    ))}
                                </Section>
                            )}

                            {results.entries.length > 0 && (
                                <Section icon={<Umbrella size={15} />} title={`Entradas concessão (${results.entries.length}) — anonimizadas, não apagadas`} color="#0369a1" note="Obrigação fiscal">
                                    {results.entries.map((e: any) => (
                                        <Row key={e.id} main={e.clientName} sub={`${e.date} · ${e.period}`} />
                                    ))}
                                </Section>
                            )}

                            {results.reservations.length > 0 && (
                                <Section icon={<Umbrella size={15} />} title={`Reservas concessão (${results.reservations.length}) — anonimizadas, não apagadas`} color="#0369a1" note="Obrigação fiscal">
                                    {results.reservations.map((r: any) => (
                                        <Row key={r.id} main={r.clientName} sub={`${r.startDate} → ${r.endDate}`} />
                                    ))}
                                </Section>
                            )}

                            {results.staffRequests.length > 0 && (
                                <Section icon={<Trash2 size={15} />} title={`Pedidos de staff (${results.staffRequests.length}) — eliminados permanentemente`} color="#dc2626">
                                    {results.staffRequests.map((s: any) => (
                                        <Row key={s.id} main={s.clientName ?? "—"} sub={s.date} />
                                    ))}
                                </Section>
                            )}

                            {/* Confirm / Erase */}
                            {!confirming ? (
                                <button
                                    onClick={() => setConfirming(true)}
                                    style={{
                                        marginTop: 24, padding: "12px 24px", borderRadius: 8,
                                        border: "none", background: "#dc2626", color: "#fff",
                                        fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
                                        display: "flex", alignItems: "center", gap: 8,
                                    }}
                                >
                                    <Trash2 size={16} /> Apagar dados pessoais
                                </button>
                            ) : (
                                <div style={{ marginTop: 24, padding: "20px 24px", background: "#fef2f2", border: "2px solid #dc2626", borderRadius: 10 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                        <AlertTriangle size={20} color="#dc2626" />
                                        <strong style={{ color: "#dc2626" }}>Confirmação obrigatória</strong>
                                    </div>
                                    <p style={{ margin: "0 0 16px", fontSize: "0.875rem", color: "#374151" }}>
                                        Esta acção é <strong>irreversível</strong>. Todos os dados pessoais de "<strong>{query}</strong>" serão permanentemente eliminados ou anonimizados. Tem a certeza?
                                    </p>
                                    <div style={{ display: "flex", gap: 10 }}>
                                        <button
                                            onClick={handleErase}
                                            disabled={erasing}
                                            style={{
                                                padding: "10px 20px", borderRadius: 8, border: "none",
                                                background: "#dc2626", color: "#fff", fontWeight: 600,
                                                cursor: "pointer", opacity: erasing ? 0.6 : 1,
                                            }}
                                        >
                                            {erasing ? "A apagar..." : "Sim, apagar permanentemente"}
                                        </button>
                                        <button
                                            onClick={() => setConfirming(false)}
                                            style={{
                                                padding: "10px 20px", borderRadius: 8,
                                                border: "1px solid #e2e8f0", background: "#fff",
                                                color: "#374151", fontWeight: 500, cursor: "pointer",
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function Section({ icon, title, color, note, children }: { icon: React.ReactNode; title: string; color: string; note?: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 16, border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "#f8fafc", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" }}>{title}</span>
                {note && <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#64748b", background: "#e2e8f0", padding: "2px 8px", borderRadius: 20 }}>{note}</span>}
            </div>
            <div>{children}</div>
        </div>
    );
}

function Row({ main, sub }: { main: string; sub: string }) {
    return (
        <div style={{ padding: "9px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem" }}>
            <span style={{ fontWeight: 500, color: "#1e293b" }}>{main}</span>
            <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{sub}</span>
        </div>
    );
}
