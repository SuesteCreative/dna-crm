"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from "recharts";
import { CheckCircle, Clock, XCircle, TrendingUp, TrendingDown, Minus, Pencil, UserCheck } from "lucide-react";
import "../Dashboard.css";
import "./statistics.css";

const PERIODS = [
    { value: "7d",     label: "Últimos 7 dias" },
    { value: "30d",    label: "Últimos 30 dias" },
    { value: "90d",    label: "Últimos 90 dias" },
    { value: "1y",     label: "Último ano" },
    { value: "all",    label: "Todo o período" },
    { value: "custom", label: "Personalizado" },
];


function fmt(n: number) {
    return new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function fmtInt(n: number) {
    return new Intl.NumberFormat("pt-PT").format(n);
}

function ChartTooltip({ active, payload, label, currency }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <div className="tooltip-label">{label}</div>
            {payload.map((p: any, i: number) => (
                <div key={i} className="tooltip-row">
                    <span className="tooltip-dot" style={{ background: p.color }} />
                    <span>{p.name}: {currency ? `€${fmt(p.value)}` : fmtInt(p.value)}</span>
                </div>
            ))}
        </div>
    );
}

function BarRankList({ items, valueKey, valuePrefix = "", maxItems = 10 }: {
    items: Array<{ name: string; [k: string]: any }>;
    valueKey: string;
    valuePrefix?: string;
    maxItems?: number;
}) {
    if (!items.length) return <p className="stats-empty">Sem dados</p>;
    const max = Math.max(...items.slice(0, maxItems).map(i => i[valueKey]));
    return (
        <div className="bar-rank-list">
            {items.slice(0, maxItems).map((item, idx) => (
                <div key={idx} className="bar-rank-row">
                    <div className="bar-rank-meta">
                        <span className="bar-rank-name">{item.name}</span>
                        <span className="bar-rank-val">{valuePrefix}{typeof item[valueKey] === "number" && valuePrefix === "€" ? fmt(item[valueKey]) : fmtInt(item[valueKey])}</span>
                    </div>
                    <div className="bar-rank-track">
                        <div className="bar-rank-fill" style={{ width: `${max > 0 ? (item[valueKey] / max) * 100 : 0}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function StatisticsPage() {
    const { isLoaded, isSignedIn } = useUser();
    const { sessionClaims } = useAuth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isPartner = role === "PARTNER";
    const router = useRouter();
    const [period, setPeriod] = useState("all");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isLoaded && !isSignedIn) router.push("/sign-in");
    }, [isLoaded, isSignedIn, router]);

    const fetchStats = useCallback(() => {
        if (!isSignedIn) return;
        if (period === "custom" && (!customStart || !customEnd)) return;
        setLoading(true);
        const url = period === "custom"
            ? `/api/stats?period=custom&startDate=${customStart}&endDate=${customEnd}`
            : `/api/stats?period=${period}`;
        fetch(url)
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [period, customStart, customEnd, isSignedIn]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    if (!isLoaded || !isSignedIn) return <div className="loading-screen"><div className="loader" /></div>;

    const kpis = data?.kpis ?? {};
    const growth = kpis.revenueGrowth;

    return (
        <div className="crm-root">
            <div className="crm-main">

                {/* ── HEADER ── */}
                <div className="stats-header">
                    <div>
                        <h1 className="page-title">Estatísticas</h1>
                        <p className="page-sub">Análise de vendas, clientes e operação</p>
                    </div>
                    <div className="period-controls">
                        <select
                            className="period-select"
                            value={period}
                            onChange={e => setPeriod(e.target.value)}
                        >
                            {PERIODS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                        {period === "custom" && (
                            <div className="date-range">
                                <input
                                    type="date"
                                    className="date-input"
                                    value={customStart}
                                    onChange={e => setCustomStart(e.target.value)}
                                />
                                <span className="date-sep">—</span>
                                <input
                                    type="date"
                                    className="date-input"
                                    value={customEnd}
                                    onChange={e => setCustomEnd(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="loading-screen" style={{ height: 300 }}>
                        <div className="loader" />
                    </div>
                ) : !data ? (
                    <p className="stats-empty">Erro ao carregar dados.</p>
                ) : (
                    <>
                        {/* ── KPIs ── */}
                        <div className="kpi-grid">
                            <div className="kpi-card">
                                <span className="kpi-label">Receita Total</span>
                                <span className="kpi-value">€{fmt(kpis.totalRevenue ?? 0)}</span>
                                {growth !== null && (
                                    <span className={`kpi-growth ${growth > 0 ? "positive" : growth < 0 ? "negative" : "neutral"}`}>
                                        {growth > 0 ? <TrendingUp size={13} /> : growth < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                                        {growth > 0 ? "+" : ""}{growth?.toFixed(1)}% vs período anterior
                                    </span>
                                )}
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Total de Ordens</span>
                                <span className="kpi-value">{fmtInt(kpis.totalOrders ?? 0)}</span>
                            </div>
                            <div className="kpi-card">
                                <span className="kpi-label">Ticket Médio</span>
                                <span className="kpi-value">€{fmt(kpis.avgTicket ?? 0)}</span>
                            </div>
                            {!isPartner && (
                                <div className="kpi-card">
                                    <span className="kpi-label">Clientes Ativos</span>
                                    <span className="kpi-value">{fmtInt(kpis.activeCustomers ?? 0)}</span>
                                </div>
                            )}
                            {!isPartner && (
                                <div className="kpi-card">
                                    <span className="kpi-label">Crescimento</span>
                                    <span className="kpi-value" style={{ color: growth === null ? "var(--muted)" : growth >= 0 ? "var(--green)" : "var(--red)" }}>
                                        {growth === null ? "—" : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
                                    </span>
                                </div>
                            )}
                            {isPartner && data.partnerSelf && (
                                <>
                                    <div className="kpi-card">
                                        <span className="kpi-label">Taxa de Comissão</span>
                                        <span className="kpi-value">{data.partnerSelf.commissionPct}%</span>
                                    </div>
                                    <div className="kpi-card">
                                        <span className="kpi-label">Comissão Estimada</span>
                                        <span className="kpi-value" style={{ color: "var(--green)" }}>€{fmt(data.partnerSelf.commissionEarned ?? 0)}</span>
                                        {data.partnerSelf.noShowCount > 0 && (
                                            <span className="kpi-growth negative">
                                                {data.partnerSelf.noShowCount} no-show excluído{data.partnerSelf.noShowCount !== 1 ? "s" : ""} (−€{fmt(data.partnerSelf.noShowRevenue ?? 0)})
                                            </span>
                                        )}
                                    </div>
                                    {data.partnerSelf.noShowCount > 0 && (
                                        <div className="kpi-card">
                                            <span className="kpi-label">No-shows</span>
                                            <span className="kpi-value" style={{ color: "var(--red)" }}>{fmtInt(data.partnerSelf.noShowCount)}</span>
                                            <span className="kpi-growth neutral">−€{fmt(data.partnerSelf.noShowRevenue ?? 0)} sem comissão</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* ── VENDAS ── */}
                        <div className="stats-section">
                            <h2 className="stats-section-title">Vendas</h2>

                            {/* Revenue over time */}
                            <div className="chart-card">
                                <div className="chart-card-title">Receita por mês</div>
                                {data.revenueByMonth?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220}>
                                        <AreaChart data={data.revenueByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `€${v}`} />
                                            <Tooltip content={<ChartTooltip currency />} />
                                            <Area type="monotone" dataKey="revenue" name="Receita" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <p className="stats-empty">Sem dados para o período</p>}
                            </div>

                            <div className="chart-two-col">
                                {/* By channel */}
                                <div className="chart-card">
                                    <div className="chart-card-title">Receita por canal de venda</div>
                                    <BarRankList
                                        items={data.revenueByChannel?.map((c: any) => ({ name: c.channel, revenue: c.revenue, count: c.count }))}
                                        valueKey="revenue"
                                        valuePrefix="€"
                                    />
                                </div>

                                {/* Top services */}
                                <div className="chart-card">
                                    <div className="chart-card-title">Top serviços por receita</div>
                                    <BarRankList
                                        items={data.topServices?.map((s: any) => ({ name: s.name, revenue: s.revenue }))}
                                        valueKey="revenue"
                                        valuePrefix="€"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── CLIENTES POR PAÍS ── */}{!isPartner && (<>
                        <div className="stats-section">
                            <h2 className="stats-section-title">Clientes por País</h2>
                            {data.topCountries?.length > 0 ? (
                                <div className="chart-two-col">
                                    <div className="chart-card">
                                        <div className="chart-card-title">País com maior volume de compras</div>
                                        <BarRankList
                                            items={data.topCountries}
                                            valueKey="revenue"
                                            valuePrefix="€"
                                        />
                                    </div>
                                    <div className="chart-card">
                                        <div className="chart-card-title">Nº de ordens por país</div>
                                        <BarRankList
                                            items={data.topCountries}
                                            valueKey="count"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="chart-card">
                                    <p className="stats-empty">Sem dados de país. Faça Sync Shopify para popular esta secção.</p>
                                </div>
                            )}
                        </div>

                        {/* ── CLIENTES ── */}
                        <div className="stats-section">
                            <h2 className="stats-section-title">Clientes</h2>

                            <div className="chart-two-col">
                                {/* New vs Returning */}
                                <div className="chart-card">
                                    <div className="chart-card-title">Novos vs Recorrentes</div>
                                    {period === "all" ? (
                                        <p className="stats-empty">Disponível apenas com filtro de período</p>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8 }}>
                                            <div>
                                                <div className="bar-rank-meta" style={{ marginBottom: 6 }}>
                                                    <span style={{ color: "var(--green)", fontWeight: 600 }}>Novos clientes</span>
                                                    <span className="bar-rank-val">{data.newVsReturning?.new ?? 0}</span>
                                                </div>
                                                <div className="bar-rank-track">
                                                    <div className="bar-rank-fill" style={{ background: "var(--green)", width: `${Math.max(data.newVsReturning?.new, data.newVsReturning?.returning) > 0 ? (data.newVsReturning.new / Math.max(data.newVsReturning.new, data.newVsReturning.returning)) * 100 : 0}%` }} />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="bar-rank-meta" style={{ marginBottom: 6 }}>
                                                    <span style={{ color: "var(--blue)", fontWeight: 600 }}>Recorrentes</span>
                                                    <span className="bar-rank-val">{data.newVsReturning?.returning ?? 0}</span>
                                                </div>
                                                <div className="bar-rank-track">
                                                    <div className="bar-rank-fill" style={{ background: "var(--blue)", width: `${Math.max(data.newVsReturning?.new, data.newVsReturning?.returning) > 0 ? (data.newVsReturning.returning / Math.max(data.newVsReturning.new, data.newVsReturning.returning)) * 100 : 0}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Top customers */}
                                <div className="chart-card">
                                    <div className="chart-card-title">Top 10 clientes por valor gasto</div>
                                    <BarRankList
                                        items={data.topCustomers?.map((c: any) => ({ name: c.name, revenue: c.revenue }))}
                                        valueKey="revenue"
                                        valuePrefix="€"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── COMPORTAMENTO TEMPORAL ── */}
                        <div className="stats-section">
                            <h2 className="stats-section-title">Comportamento Temporal</h2>

                            <div className="chart-two-col">
                                {/* Day of week */}
                                <div className="chart-card">
                                    <div className="chart-card-title">Ordens por dia da semana</div>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <BarChart data={data.salesByDayOfWeek} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                            <Tooltip content={<ChartTooltip />} />
                                            <Bar dataKey="count" name="Ordens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Hour of day */}
                                <div className="chart-card">
                                    <div className="chart-card-title">Ordens por hora do dia</div>
                                    {data.salesByHour?.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={data.salesByHour} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                                <Tooltip content={<ChartTooltip />} />
                                                <Bar dataKey="count" name="Ordens" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : <p className="stats-empty">Sem dados de horário</p>}
                                </div>
                            </div>
                        </div>

                        {/* ── OPERACIONAL ── */}
                        <div className="stats-section">
                            <h2 className="stats-section-title">Operacional</h2>
                            <div className="status-cards">
                                <div className="status-card">
                                    <div className="status-icon green"><CheckCircle size={20} /></div>
                                    <div>
                                        <div className="status-info-label">Confirmadas</div>
                                        <div className="status-info-value">{fmtInt(data.statusBreakdown?.confirmed ?? 0)}</div>
                                    </div>
                                </div>
                                <div className="status-card">
                                    <div className="status-icon amber"><Clock size={20} /></div>
                                    <div>
                                        <div className="status-info-label">Pendentes</div>
                                        <div className="status-info-value">{fmtInt(data.statusBreakdown?.pending ?? 0)}</div>
                                    </div>
                                </div>
                                <div className="status-card">
                                    <div className="status-icon red"><XCircle size={20} /></div>
                                    <div>
                                        <div className="status-info-label">Canceladas</div>
                                        <div className="status-info-value">{fmtInt(data.statusBreakdown?.cancelled ?? 0)}</div>
                                    </div>
                                </div>
                            </div>
                            {/* No-show stats */}
                            {data.noShowStats && (
                                <div className="chart-two-col" style={{ marginTop: 16 }}>
                                    <div className="chart-card">
                                        <div className="chart-card-title">Presenças</div>
                                        <div className="status-cards" style={{ padding: 0, background: "none", border: "none" }}>
                                            <div className="status-card">
                                                <div className="status-icon green"><UserCheck size={20} /></div>
                                                <div>
                                                    <div className="status-info-label">Taxa de presença</div>
                                                    <div className="status-info-value">
                                                        {data.noShowStats.showRate !== null
                                                            ? `${data.noShowStats.showRate.toFixed(1)}%`
                                                            : "—"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="status-card">
                                                <div className="status-icon red"><XCircle size={20} /></div>
                                                <div>
                                                    <div className="status-info-label">No-shows</div>
                                                    <div className="status-info-value">{fmtInt(data.noShowStats.count ?? 0)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="chart-card">
                                        <div className="chart-card-title">Receita perdida (no-shows)</div>
                                        <span className="kpi-value" style={{ color: "var(--red)", fontSize: 28, fontWeight: 700 }}>
                                            −€{fmt(data.noShowStats.revenue ?? 0)}
                                        </span>
                                        {data.kpis?.totalRevenue > 0 && (
                                            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                                                {((data.noShowStats.revenue / data.kpis.totalRevenue) * 100).toFixed(1)}% da receita total
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        </>)}{/* end !isPartner sections */}

                        {/* ── EDIÇÕES ── */}{!isPartner && (
                        <div className="stats-section">
                            <h2 className="stats-section-title">Edições de Reservas</h2>
                            <div className="chart-three-col">
                                <div className="kpi-card">
                                    <span className="kpi-label">Reservas editadas</span>
                                    <span className="kpi-value">{fmtInt(data.editStats?.count ?? 0)}</span>
                                    {kpis.totalOrders > 0 && (
                                        <span className="kpi-growth neutral">
                                            <Pencil size={12} />
                                            {((data.editStats?.count ?? 0) / kpis.totalOrders * 100).toFixed(1)}% do total
                                        </span>
                                    )}
                                </div>
                                <div className="kpi-card">
                                    <span className="kpi-label">Impacto na receita</span>
                                    <span className="kpi-value" style={{ color: (data.editStats?.revenueDelta ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                                        {(data.editStats?.revenueDelta ?? 0) >= 0 ? "+" : ""}€{fmt(Math.abs(data.editStats?.revenueDelta ?? 0))}
                                    </span>
                                    <span className="kpi-growth neutral">vs. valor original</span>
                                </div>
                                <div className="kpi-card">
                                    <span className="kpi-label">Variação de pax</span>
                                    <span className="kpi-value" style={{ color: (data.editStats?.paxDelta ?? 0) >= 0 ? "var(--green)" : "var(--red)" }}>
                                        {(data.editStats?.paxDelta ?? 0) >= 0 ? "+" : ""}{fmtInt(data.editStats?.paxDelta ?? 0)}
                                    </span>
                                    <span className="kpi-growth neutral">pessoas vs. original</span>
                                </div>
                            </div>
                            {data.editStats?.topTypeChanges?.length > 0 && (
                                <div className="chart-card">
                                    <div className="chart-card-title">Alterações de atividade mais frequentes</div>
                                    <table className="stats-table">
                                        <thead>
                                            <tr>
                                                <th>De → Para</th>
                                                <th className="t-right">Vezes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.editStats.topTypeChanges.map((c: any, i: number) => (
                                                <tr key={i}>
                                                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{c.change}</td>
                                                    <td className="t-right">{fmtInt(c.count)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        )}{/* end !isPartner edit section */}

                        {/* ── PARCEIROS ── */}
                        {!isPartner && data.bookingsByPartner?.length > 0 && (
                            <div className="stats-section">
                                <h2 className="stats-section-title">Marcações por Parceiro</h2>
                                <div className="chart-card">
                                    <div className="chart-card-title">Ordens, receita e comissão por parceiro</div>
                                    <table className="stats-table">
                                        <thead>
                                            <tr>
                                                <th>Parceiro</th>
                                                <th className="t-right">Ordens</th>
                                                <th className="t-right">No-shows</th>
                                                <th className="t-right">Receita Total</th>
                                                <th className="t-right">Receita Elegível</th>
                                                <th className="t-right">Comissão %</th>
                                                <th className="t-right">Comissão Est.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.bookingsByPartner.map((p: any, i: number) => (
                                                <tr key={i}>
                                                    <td>{p.name}</td>
                                                    <td className="t-right">{fmtInt(p.count)}</td>
                                                    <td className="t-right" style={{ color: p.noShowCount > 0 ? "var(--red)" : "var(--muted)" }}>
                                                        {p.noShowCount > 0 ? `${fmtInt(p.noShowCount)} (−€${fmt(p.noShowRevenue)})` : "—"}
                                                    </td>
                                                    <td className="t-right">€{fmt(p.revenue)}</td>
                                                    <td className="t-right">€{fmt(p.revenueEligible)}</td>
                                                    <td className="t-right">{p.commissionPct}%</td>
                                                    <td className="t-right" style={{ color: "var(--green)" }}>€{fmt(p.commissionEarned)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </>
                )}
            </div>
        </div>
    );
}
