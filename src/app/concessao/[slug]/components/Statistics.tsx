"use client";
import { useState, useEffect, useCallback } from "react";
import "../../../statistics/statistics.css";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

const PERIODS = [
  { value: "7d",  label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "1y",  label: "Último ano" },
  { value: "all", label: "Todo o período" },
  { value: "custom", label: "Personalizado" },
];

function fmt(n: number) {
  return new Intl.NumberFormat("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}
function fmtInt(n: number) { return new Intl.NumberFormat("pt-PT").format(n); }

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
  if (!items?.length) return <p className="stats-empty">Sem dados</p>;
  const max = Math.max(...items.slice(0, maxItems).map((i) => i[valueKey]));
  return (
    <div className="bar-rank-list">
      {items.slice(0, maxItems).map((item, idx) => (
        <div key={idx} className="bar-rank-row">
          <div className="bar-rank-meta">
            <span className="bar-rank-name">{item.name}</span>
            <span className="bar-rank-val">
              {valuePrefix}{typeof item[valueKey] === "number" && valuePrefix === "€"
                ? fmt(item[valueKey])
                : fmtInt(item[valueKey])}
            </span>
          </div>
          <div className="bar-rank-track">
            <div className="bar-rank-fill" style={{ width: `${max > 0 ? (item[valueKey] / max) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Statistics({ concession }: { concession: { id: string; slug: string } }) {
  const [period, setPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const themeColor = concession.slug === "tropico" ? "#f97316" : "#0ea5e9";
  const themeGradId = `conc-grad-${concession.slug}`;

  const load = useCallback(() => {
    if (period === "custom" && (!customStart || !customEnd)) return;
    setLoading(true);
    setError(null);
    const url = period === "custom"
      ? `/api/concessions/${concession.slug}/stats?period=custom&startDate=${customStart}&endDate=${customEnd}`
      : `/api/concessions/${concession.slug}/stats?period=${period}`;
    fetch(url)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
        setData(d);
      })
      .catch((e) => setError(e.message ?? "Erro desconhecido"))
      .finally(() => setLoading(false));
  }, [period, customStart, customEnd, concession.slug]);

  useEffect(() => { load(); }, [load]);

  const kpis = data?.kpis ?? {};

  return (
    <div className="crm-stats-wrap">
      {/* Header + period selector */}
      <div className="stats-header">
        <div>
          <h2 className="page-title" style={{ fontSize: "1.2rem", marginBottom: 2 }}>Estatísticas</h2>
          <p className="page-sub">Análise de receita, ocupação e operação</p>
        </div>
        <div className="period-controls">
          <select className="period-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {period === "custom" && (
            <div className="date-range">
              <input type="date" className="date-input" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
              <span className="date-sep">—</span>
              <input type="date" className="date-input" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ height: 200 }}><div className="loader" /></div>
      ) : !data ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "2rem 0" }}>
          <p className="stats-empty">Erro ao carregar dados: {error}</p>
          <button onClick={load} className="stats-refresh-btn" style={{ alignSelf: "flex-start" }}>Tentar novamente</button>
        </div>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Receita Total (Paga)</span>
              <span className="kpi-value">€{fmt(kpis.revenuePaid ?? 0)}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Por Cobrar</span>
              <span className="kpi-value" style={{ color: "var(--red)" }}>€{fmt(kpis.revenueUnpaid ?? 0)}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Total Entradas</span>
              <span className="kpi-value">{fmtInt(kpis.totalEntries ?? 0)}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Ocupação Média</span>
              <span className="kpi-value">{kpis.avgOccupancyPct ?? 0}%</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Reservas no Período</span>
              <span className="kpi-value">{fmtInt(kpis.totalReservations ?? 0)}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Desconto Total</span>
              <span className="kpi-value" style={{ color: "var(--amber, #f59e0b)" }}>−€{fmt(kpis.discountTotal ?? 0)}</span>
              <span className="kpi-growth neutral">{kpis.discountCount ?? 0} reserva{kpis.discountCount !== 1 ? "s" : ""} com desconto</span>
            </div>
          </div>

          {/* ── Receita ── */}
          <div className="stats-section">
            <h2 className="stats-section-title">Receita</h2>
            <div className="chart-card">
              <div className="chart-card-title">Receita por mês</div>
              {data.revenueByMonth?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.revenueByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={themeGradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={themeColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                    <Tooltip content={<ChartTooltip currency />} />
                    <Area type="monotone" dataKey="revenue" name="Receita" stroke={themeColor} strokeWidth={2} fill={`url(#${themeGradId})`} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="stats-empty">Sem dados para o período</p>}
            </div>

            <div className="chart-two-col">
              <div className="chart-card">
                <div className="chart-card-title">Receita por modalidade</div>
                <BarRankList items={data.periodBreakdown} valueKey="revenue" valuePrefix="€" />
              </div>
              <div className="chart-card">
                <div className="chart-card-title">Entradas por modalidade</div>
                <BarRankList items={data.periodBreakdown} valueKey="count" />
              </div>
            </div>
          </div>

          {/* ── Comportamento Semanal ── */}
          <div className="stats-section">
            <h2 className="stats-section-title">Comportamento Semanal</h2>
            <div className="chart-two-col">
              <div className="chart-card">
                <div className="chart-card-title">Entradas por dia da semana</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.salesByDayOfWeek} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Entradas" fill={themeColor} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <div className="chart-card-title">Receita por dia da semana</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.salesByDayOfWeek} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${v}`} />
                    <Tooltip content={<ChartTooltip currency />} />
                    <Bar dataKey="revenue" name="Receita" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── Descontos e Reservas ── */}
          <div className="stats-section">
            <h2 className="stats-section-title">Descontos &amp; Reservas</h2>
            <div className="chart-two-col">
              <div className="chart-card">
                <div className="chart-card-title">Walk-in vs Reserva</div>
                <div className="bar-rank-list" style={{ paddingTop: 8 }}>
                  {[
                    { name: "Walk-in", count: data.walkInVsReservation?.walkIn?.count ?? 0, revenue: data.walkInVsReservation?.walkIn?.revenue ?? 0 },
                    { name: "Reserva",  count: data.walkInVsReservation?.reservation?.count ?? 0, revenue: data.walkInVsReservation?.reservation?.revenue ?? 0 },
                  ].map((item) => {
                    const max = Math.max(data.walkInVsReservation?.walkIn?.count ?? 0, data.walkInVsReservation?.reservation?.count ?? 0, 1);
                    return (
                      <div key={item.name} className="bar-rank-row">
                        <div className="bar-rank-meta">
                          <span className="bar-rank-name">{item.name}</span>
                          <span className="bar-rank-val">{fmtInt(item.count)} · €{fmt(item.revenue)}</span>
                        </div>
                        <div className="bar-rank-track">
                          <div className="bar-rank-fill" style={{ width: `${(item.count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-card-title">Desconto 7=6 aplicado</div>
                <div style={{ paddingTop: 8, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--amber, #f59e0b)" }}>
                      −€{fmt(kpis.discountTotal ?? 0)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted, #64748b)", marginTop: 4 }}>
                      impacto na receita
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>{fmtInt(kpis.discountCount ?? 0)}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted, #64748b)", marginTop: 4 }}>
                      reservas com semana grátis
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Camas & Carry-overs ── */}
          <div className="stats-section">
            <h2 className="stats-section-title">Configuração de Camas</h2>
            <div className="chart-two-col">
              <div className="chart-card">
                <div className="chart-card-title">Camas por receita</div>
                <BarRankList items={data.bedBreakdown} valueKey="revenue" valuePrefix="€" />
              </div>
              <div className="chart-card">
                <div className="chart-card-title">Carry-overs</div>
                <div style={{ paddingTop: 8, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{fmtInt(data.carryOvers?.count ?? 0)}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted, #64748b)", marginTop: 4 }}>entradas carry-over</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700 }}>€{fmt(data.carryOvers?.revenue ?? 0)}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted, #64748b)", marginTop: 4 }}>receita associada</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Top Clientes ── */}
          <div className="stats-section">
            <h2 className="stats-section-title">Top Clientes</h2>
            <div className="chart-two-col">
              <div className="chart-card">
                <div className="chart-card-title">Por receita</div>
                <BarRankList items={data.topClients} valueKey="revenue" valuePrefix="€" />
              </div>
              <div className="chart-card">
                <div className="chart-card-title">Por nº de entradas</div>
                <BarRankList items={data.topClients?.slice().sort((a: any, b: any) => b.count - a.count)} valueKey="count" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
