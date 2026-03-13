"use client";
import { useEffect, useState } from "react";
import { TrendingUp, CalendarDays, Armchair, Euro, BookOpen, RefreshCw } from "lucide-react";

interface StatsData {
  totalSpots: number;
  today: {
    date: string;
    occupied: number;
    free: number;
    occupancyPct: number;
    revenuePaid: number;
    revenueUnpaid: number;
    carryOvers: number;
    periods: { morning: number; afternoon: number; fullDay: number };
  };
  week: {
    days: { date: string; occupied: number; occupancyPct: number; revenuePaid: number; revenueUnpaid: number }[];
  };
  month: {
    label: string;
    revenuePaid: number;
    revenueUnpaid: number;
    avgOccupancy: number;
    avgOccupancyPct: number;
  };
  reservations: {
    upcoming: {
      id: string;
      clientName: string;
      spotNumber: number;
      startDate: string;
      endDate: string;
      period: string;
      totalPrice: number;
      isPaid: boolean;
    }[];
    count: number;
    totalValue: number;
  };
}

const PERIOD_PT: Record<string, string> = {
  MORNING: "Manhã",
  AFTERNOON: "Tarde",
  FULL_DAY: "Dia Inteiro",
};

function fmt(v: number) {
  return v.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "€";
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

function fmtWeekday(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-PT", { weekday: "short" });
}

export default function Statistics({ concession }: { concession: { id: string; slug: string } }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/concessions/${concession.slug}/stats`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [concession.slug]);

  if (loading) return <div className="stats-loading"><RefreshCw size={20} className="stats-spin" /> A carregar...</div>;
  if (!data) return <div className="stats-loading">Erro ao carregar estatísticas.</div>;

  const maxBar = Math.max(...data.week.days.map((d) => d.occupancyPct), 1);

  return (
    <div className="stats-page">

      {/* KPI row */}
      <div className="stats-kpis">
        <div className="stats-kpi">
          <div className="stats-kpi-icon"><Armchair size={20} /></div>
          <div className="stats-kpi-body">
            <div className="stats-kpi-value">{data.today.occupancyPct}%</div>
            <div className="stats-kpi-label">Ocupação hoje</div>
            <div className="stats-kpi-sub">{data.today.occupied}/{data.totalSpots} lugares</div>
          </div>
        </div>

        <div className="stats-kpi">
          <div className="stats-kpi-icon"><Euro size={20} /></div>
          <div className="stats-kpi-body">
            <div className="stats-kpi-value">{fmt(data.today.revenuePaid)}</div>
            <div className="stats-kpi-label">Receita hoje (pago)</div>
            <div className="stats-kpi-sub">{fmt(data.today.revenueUnpaid)} por cobrar</div>
          </div>
        </div>

        <div className="stats-kpi">
          <div className="stats-kpi-icon"><TrendingUp size={20} /></div>
          <div className="stats-kpi-body">
            <div className="stats-kpi-value">{fmt(data.month.revenuePaid)}</div>
            <div className="stats-kpi-label">Receita {data.month.label}</div>
            <div className="stats-kpi-sub">Média {data.month.avgOccupancyPct}% ocupação</div>
          </div>
        </div>

        <div className="stats-kpi">
          <div className="stats-kpi-icon"><BookOpen size={20} /></div>
          <div className="stats-kpi-body">
            <div className="stats-kpi-value">{data.reservations.count}</div>
            <div className="stats-kpi-label">Reservas activas</div>
            <div className="stats-kpi-sub">{fmt(data.reservations.totalValue)} total</div>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {/* Weekly occupancy chart */}
        <div className="stats-card stats-card-wide">
          <div className="stats-card-title"><CalendarDays size={15} /> Próximos 7 dias — Ocupação</div>
          <div className="stats-bars">
            {data.week.days.map((d) => (
              <div key={d.date} className="stats-bar-col">
                <div className="stats-bar-pct">{d.occupancyPct}%</div>
                <div className="stats-bar-track">
                  <div
                    className="stats-bar-fill"
                    style={{ height: `${(d.occupancyPct / maxBar) * 100}%` }}
                  />
                </div>
                <div className="stats-bar-day">{fmtWeekday(d.date)}</div>
                <div className="stats-bar-date">{fmtDate(d.date)}</div>
                <div className="stats-bar-rev">{fmt(d.revenuePaid + d.revenueUnpaid)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Today breakdown */}
        <div className="stats-card">
          <div className="stats-card-title"><Armchair size={15} /> Hoje — Detalhe</div>
          <div className="stats-rows">
            <div className="stats-row">
              <span>Manhã</span><span>{data.today.periods.morning} lugares</span>
            </div>
            <div className="stats-row">
              <span>Tarde</span><span>{data.today.periods.afternoon} lugares</span>
            </div>
            <div className="stats-row">
              <span>Dia Inteiro</span><span>{data.today.periods.fullDay} lugares</span>
            </div>
            <div className="stats-row stats-row-sep">
              <span>Carry-overs</span><span>{data.today.carryOvers}</span>
            </div>
            <div className="stats-row">
              <span>Receita paga</span><strong>{fmt(data.today.revenuePaid)}</strong>
            </div>
            <div className="stats-row">
              <span>Por cobrar</span><strong className="stats-unpaid">{fmt(data.today.revenueUnpaid)}</strong>
            </div>
          </div>
        </div>

        {/* Upcoming reservations */}
        <div className="stats-card stats-card-wide">
          <div className="stats-card-title"><BookOpen size={15} /> Reservas Activas / Futuras</div>
          {data.reservations.upcoming.length === 0 ? (
            <div className="stats-empty">Sem reservas activas.</div>
          ) : (
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Lugar</th>
                  <th>Período</th>
                  <th>Datas</th>
                  <th>Valor</th>
                  <th>Pago</th>
                </tr>
              </thead>
              <tbody>
                {data.reservations.upcoming.map((r) => (
                  <tr key={r.id}>
                    <td>{r.clientName}</td>
                    <td className="stats-center">{r.spotNumber}</td>
                    <td>{PERIOD_PT[r.period] ?? r.period}</td>
                    <td className="stats-nowrap">{fmtDate(r.startDate)} → {fmtDate(r.endDate)}</td>
                    <td className="stats-right">{fmt(r.totalPrice)}</td>
                    <td className="stats-center">
                      <span className={`stats-badge ${r.isPaid ? "paid" : "unpaid"}`}>
                        {r.isPaid ? "Sim" : "Não"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="stats-refresh">
        <button onClick={load} className="stats-refresh-btn">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>
    </div>
  );
}
