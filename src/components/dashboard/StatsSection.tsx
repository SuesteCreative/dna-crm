import React from "react";
import { 
  BarChart2, ChevronDown, Calendar, CheckCircle, UserX, Activity, TrendingUp 
} from "lucide-react";
import { Booking, Partner } from "./types";

interface StatsSectionProps {
  bookings: Booking[];
  partners: Partner[];
  confirmed: number;
  noShows: Booking[];
  revenue: number;
  projectedRevenue: number;
  noShowByPartner: { id: string; name: string; count: number }[];
  noShowByChannel: { src: string; count: number }[];
  statsCollapsed: boolean;
  setStatsCollapsed: (collapsed: boolean) => void;
  isPartner: boolean;
  partnerColorMap: Map<string, { bg: string; text: string }>;
  PARTNER_PALETTE: { bg: string; text: string }[];
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  bookings,
  partners,
  confirmed,
  noShows,
  revenue,
  projectedRevenue,
  noShowByPartner,
  noShowByChannel,
  statsCollapsed,
  setStatsCollapsed,
  isPartner,
  partnerColorMap,
  PARTNER_PALETTE,
}) => {
  return (
    <div className="stats-accordion">
      <div className="stats-accordion-header" onClick={() => setStatsCollapsed(!statsCollapsed)}>
        <div className="stats-accordion-title">
          <BarChart2 size={18} />
          <span>Estatísticas Rápidas</span>
        </div>
        <div className="stats-accordion-toggle">
          {statsCollapsed ? 'Ver Mais' : 'Ver Menos'}
          <ChevronDown size={16} className={statsCollapsed ? '' : 'rotate-180'} />
        </div>
      </div>

      <div className={`stats-accordion-content ${statsCollapsed ? 'collapsed' : ''}`}>
        <section className="stats-row">
          <div className="stat-tile blue">
            <div className="tile-ico"><Calendar size={22} /></div>
            <div className="tile-info">
              <span className="tile-val">{bookings.length}</span>
              <span className="tile-lbl">Total de Reservas</span>
            </div>
            <TrendingUp size={40} className="tile-bg-ico" />
          </div>
          <div className="stat-tile green">
            <div className="tile-ico"><CheckCircle size={22} /></div>
            <div className="tile-info">
              <span className="tile-val">{confirmed}</span>
              <span className="tile-lbl">Confirmadas</span>
            </div>
            <CheckCircle size={40} className="tile-bg-ico" />
          </div>
          <div className="stat-tile red">
            <div className="tile-ico"><UserX size={22} /></div>
            <div className="tile-info">
              <span className="tile-val">{noShows.length}</span>
              <span className="tile-lbl">Não Compareceu</span>
            </div>
            <UserX size={40} className="tile-bg-ico" />
          </div>
          <div className="stat-tile teal">
            <div className="tile-ico"><Activity size={22} /></div>
            <div className="tile-info">
              <span className="tile-val">{revenue.toFixed(0)}€</span>
              <span className="tile-lbl">Receita Total</span>
            </div>
            <TrendingUp size={40} className="tile-bg-ico" />
          </div>
          <div className="stat-tile teal">
            <div className="tile-ico"><TrendingUp size={22} /></div>
            <div className="tile-info">
              <span className="tile-val">{(revenue + projectedRevenue).toFixed(0)}€</span>
              <span className="tile-lbl">Receita Projetada</span>
              <span className="tile-note">+{projectedRevenue.toFixed(0)}€ futuro</span>
            </div>
            <TrendingUp size={40} className="tile-bg-ico" />
          </div>
        </section>

        {!isPartner && (noShowByPartner.length > 0 || noShowByChannel.length > 0) && (
          <div className="noshow-breakdown">
            {noShowByPartner.length > 0 && (
              <div className="noshow-card">
                <div className="noshow-card-title">Parceiros — Não Compareceu</div>
                <div className="noshow-list">
                  {noShowByPartner.map(p => {
                    const color = partnerColorMap.get(p.id) ?? PARTNER_PALETTE[0];
                    return (
                      <div key={p.id} className="noshow-row">
                        <span className="noshow-row-name" style={{ color: color.text }}>{p.name}</span>
                        <span className="noshow-row-count">{p.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {noShowByChannel.length > 0 && (
              <div className="noshow-card">
                <div className="noshow-card-title">Canal — Não Compareceu</div>
                <div className="noshow-list">
                  {noShowByChannel.map(x => (
                    <div key={x.src} className="noshow-row">
                      <span className="noshow-row-name">{x.src}</span>
                      <span className="noshow-row-count">{x.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
