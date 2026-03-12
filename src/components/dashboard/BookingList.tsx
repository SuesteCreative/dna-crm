import React, { Fragment } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  ChevronDown, Pencil, UserCheck, CalendarDays 
} from "lucide-react";
import { Booking, Service } from "./types";
import { StatusBadge, SourceBadge } from "./DashboardHelpers";

interface BookingListProps {
  bookings: Booking[];
  years: string[];
  grouped: Record<string, Record<string, Booking[]>>;
  collapsed: Record<string, boolean>;
  toggleGroup: (key: string) => void;
  dayViewMonths: Record<string, boolean>;
  toggleDayView: (key: string) => void;
  collapsedDays: Record<string, boolean>;
  toggleDay: (key: string) => void;
  expandedGhosts: Record<string, boolean>;
  toggleGhost: (id: string) => void;
  openEdit: (b: Booking) => void;
  setAttendanceTarget: (b: Booking) => void;
  isPartner: boolean;
  partners: { id: string; name: string }[];
  partnerColorMap: Map<string, { bg: string; text: string }>;
  isToday: (b: Booking) => boolean;
  isFuture: (b: Booking) => boolean;
  isNoShow: (b: Booking) => boolean;
  anyTodayInGroup: (bkgs: Booking[]) => boolean;
  anyFutureInGroup: (bkgs: Booking[]) => boolean;
  anyTodayInYear: (year: string) => boolean;
  anyFutureInYear: (year: string) => boolean;
  currentYearStr: string;
  currentMonthKey: string;
}

export const BookingList: React.FC<BookingListProps> = ({
  bookings,
  years,
  grouped,
  collapsed,
  toggleGroup,
  dayViewMonths,
  toggleDayView,
  collapsedDays,
  toggleDay,
  expandedGhosts,
  toggleGhost,
  openEdit,
  setAttendanceTarget,
  isPartner,
  partners,
  partnerColorMap,
  isToday,
  isFuture,
  isNoShow,
  anyTodayInGroup,
  anyFutureInGroup,
  anyTodayInYear,
  anyFutureInYear,
  currentYearStr,
  currentMonthKey,
}) => {

  const renderBookingTable = (bkgs: Booking[]) => (
    <div className="table-wrap">
      <table className="crm-table">
        <thead>
          <tr>
            <th style={{ width: "15%" }}>Cliente</th>
            <th style={{ width: "4%", textAlign: "center" }}>Qtd</th>
            <th style={{ width: "20%" }}>Atividade</th>
            <th style={{ width: "9%" }}>Data / Hora</th>
            <th style={{ width: "5%", textAlign: "center" }}>Pax</th>
            <th style={{ width: "11%" }}>Fonte</th>
            <th style={{ width: "10%" }}>Status</th>
            <th style={{ width: "7%", textAlign: "right" }}>Preço</th>
            <th style={{ width: "4%", textAlign: "center" }}>Pres.</th>
            <th style={{ width: "4%" }}></th>
          </tr>
        </thead>
        <tbody>
          {bkgs.map(b => (
            <Fragment key={b.id}>
              <tr className={isFuture(b) ? "row-future" : isToday(b) ? "row-today" : ""}>
                <td>
                  <div className="cell-name">{b.customerName}</div>
                  <div className="cell-sub">{b.customerEmail || "—"}</div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    {b.activities && b.activities.length > 0 ? (
                      b.activities.map(a => <span key={a.id} className="qty-badge">{a.quantity || 1}</span>)
                    ) : (
                      <span className="qty-badge">{b.quantity || 1}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="cell-name cell-activity-row">
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {b.activities && b.activities.length > 0 ? (
                        b.activities.map(a => <span key={a.id}>{a.activityType || "—"}</span>)
                      ) : (
                        <span>{b.activityType || b.notes || "—"}</span>
                      )}
                    </div>
                    {b.isEdited && (
                      <span className="activity-badges">
                        <span className="badge-edited">Editada</span>
                        <button
                          className="btn-ghost-toggle"
                          title={expandedGhosts[b.id] ? "Esconder original" : "Ver original"}
                          onClick={() => toggleGhost(b.id)}
                        >
                          <ChevronDown size={11} className={expandedGhosts[b.id] ? "ghost-ico open" : "ghost-ico"} />
                        </button>
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    {b.activities && b.activities.length > 0 ? (
                      b.activities.map(a => (
                        <div key={a.id}>
                          <div className="cell-name">{new Date(a.activityDate).toLocaleDateString("pt-PT")}</div>
                          <div className="cell-sub">{a.activityTime || "—"}</div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="cell-name">{new Date(b.activityDate).toLocaleDateString("pt-PT")}</div>
                        <div className="cell-sub">{b.activityTime || "—"}</div>
                      </>
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {b.activities && b.activities.length > 0 ? (
                      b.activities.map(a => <span key={a.id} className="pax-pill">{a.pax} pax</span>)
                    ) : (
                      <span className="pax-pill">{b.pax} pax</span>
                    )}
                  </div>
                </td>
                <td>
                  <SourceBadge 
                    source={b.source} 
                    orderNumber={b.orderNumber} 
                    partnerId={b.partnerId} 
                    partners={partners} 
                    partnerColorMap={partnerColorMap} 
                  />
                </td>
                <td><StatusBadge status={b.status} /></td>
                <td className={`price-cell${isNoShow(b) ? " price-noshow" : ""}`}>
                  {isNoShow(b) ? (
                    "0.00€"
                  ) : b.activities && b.activities.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {b.activities.map(a => <div key={a.id}>{a.totalPrice != null ? `${a.totalPrice.toFixed(2)}€` : "—"}</div>)}
                      {b.activities.length > 1 && (
                        <div style={{ borderTop: "1px solid #eee", marginTop: "2px", fontWeight: "bold" }}>
                          {b.totalPrice != null ? `${b.totalPrice.toFixed(2)}€` : "—"}
                        </div>
                      )}
                    </div>
                  ) : (
                    b.totalPrice != null ? `${b.totalPrice.toFixed(2)}€` : "—"
                  )}
                </td>
                <td>
                  {b.status !== "CANCELLED" && !isPartner ? (
                    <button
                      className={b.showedUp ? "attendance-verified" : "btn-attendance"}
                      title={b.showedUp ? "Clique para desmarcar presença" : "Confirmar presença"}
                      onClick={() => setAttendanceTarget(b)}
                    >
                      <UserCheck size={16} />
                    </button>
                  ) : null}
                </td>
                <td>
                  <button className="btn-edit" onClick={() => openEdit(b)}>
                    <Pencil size={15} />
                  </button>
                </td>
              </tr>
              {b.isEdited && expandedGhosts[b.id] && (() => {
                const origQty = b.originalQuantity ?? b.quantity ?? 1;
                const origType = b.originalActivityType ?? b.activityType ?? "—";
                const origPax = b.originalPax ?? b.pax;
                const origPrice = b.originalTotalPrice;
                const origDate = b.originalActivityDate ? new Date(b.originalActivityDate).toLocaleDateString("pt-PT") : null;
                const origTime = b.originalActivityTime ?? null;
                const qtyChg = origQty !== (b.quantity ?? 1);
                const typeChg = b.originalActivityType !== null && b.originalActivityType !== b.activityType;
                const paxChg = b.originalPax !== null && b.originalPax !== b.pax;
                const priceChg = origPrice !== null && origPrice !== b.totalPrice;
                const curDate = new Date(b.activityDate).toLocaleDateString("pt-PT");
                const dateChg = origDate !== null && origDate !== curDate;
                const timeChg = origTime !== null && origTime !== (b.activityTime ?? null);
                return (
                  <tr className="row-ghost-original">
                    <td />
                    <td>
                      <div style={{ display: "flex", justifyContent: "center" }}>
                        <span className={`qty-badge qty-badge-ghost${qtyChg ? " ghost-struck" : ""}`}>{origQty}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-activity-row">
                        <span className={typeChg ? "ghost-text" : "ghost-muted"}>{origType}</span>
                        <span className="ghost-label">Original</span>
                      </div>
                    </td>
                    <td>
                      {origDate !== null && <div className={dateChg ? "ghost-text" : "ghost-muted"}>{origDate}</div>}
                      {(origTime !== null || timeChg) && <div className={timeChg ? "ghost-text" : "ghost-muted"}>{origTime || "—"}</div>}
                    </td>
                    <td><span className={`pax-pill pax-pill-ghost${paxChg ? " ghost-struck" : ""}`}>{origPax} pax</span></td>
                    <td /><td />
                    <td className={`price-cell${priceChg ? " ghost-text" : " ghost-muted"}`}>
                      {origPrice != null ? `${origPrice.toFixed(2)}€` : (b.totalPrice != null ? `${b.totalPrice.toFixed(2)}€` : "—")}
                    </td>
                    <td /><td />
                  </tr>
                );
              })()}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBookingCards = (bkgs: Booking[]) => (
    <div className="booking-cards-mobile">
      {bkgs.map(b => (
        <div key={b.id} className={`booking-card ${isFuture(b) ? "is-future" : isToday(b) ? "is-today" : ""}`}>
          <div className="card-row-top">
            <div className="card-client">
              <div className="cell-name">{b.customerName}</div>
              <div className="cell-sub">{b.customerEmail || b.customerPhone || "—"}</div>
            </div>
            <div className="card-actions">
              <button className="btn-edit-sm" onClick={() => openEdit(b)}>
                <Pencil size={15} />
              </button>
            </div>
          </div>
          <div className="card-main-info">
            <div className="card-info-item">
              <span className="info-label">Atividade:</span>
              <div className="info-val">
                {b.activities && b.activities.length > 0 ? (
                   <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
                     {b.activities.map(a => (
                       <div key={a.id} style={{ padding: "4px", background: "rgba(0,0,0,0.02)", borderRadius: "4px" }}>
                         <div><b>{a.activityType || "—"}</b></div>
                         <div style={{ fontSize: "0.85em", color: "#666" }}>
                           {new Date(a.activityDate).toLocaleDateString("pt-PT")} {a.activityTime || ""} | {a.pax} pax ({a.quantity || 1}x)
                         </div>
                       </div>
                     ))}
                   </div>
                ) : (
                  <>
                    {b.activityType || b.notes || "—"}
                    {b.isEdited && <span className="badge-edited" style={{ marginLeft: 6 }}>Editada</span>}
                  </>
                )}
              </div>
            </div>
            {!b.activities || b.activities.length === 0 ? (
              <div className="card-grid-lite">
                <div className="card-info-item">
                  <span className="info-label">Data/Hora:</span>
                  <span className="info-val">{new Date(b.activityDate).toLocaleDateString("pt-PT")} {b.activityTime || ""}</span>
                </div>
                <div className="card-info-item">
                  <span className="info-label">Pax:</span>
                  <span className="info-val">{b.pax} pax ({b.quantity || 1}x)</span>
                </div>
              </div>
            ) : null}
          </div>
          <div className="card-footer">
            <div className="card-badges">
              <SourceBadge 
                source={b.source} 
                orderNumber={b.orderNumber} 
                partnerId={b.partnerId} 
                partners={partners} 
                partnerColorMap={partnerColorMap} 
              />
              <StatusBadge status={b.status} />
            </div>
            <div className="card-price-pres">
              <span className={`price-val ${isNoShow(b) ? "price-noshow" : ""}`}>
                {isNoShow(b) ? "0.00€" : b.totalPrice != null ? `${b.totalPrice.toFixed(2)}€` : "—"}
              </span>
              {b.status !== "CANCELLED" && !isPartner && (
                <button
                  className={b.showedUp ? "attendance-verified-sm" : "btn-attendance-sm"}
                  title={b.showedUp ? "Clique para desmarcar presença" : "Confirmar presença"}
                  onClick={() => setAttendanceTarget(b)}
                >
                  <UserCheck size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {years.map(year => {
        const yearHasFuture = anyFutureInYear(year);
        const yearHasToday = !yearHasFuture && anyTodayInYear(year);
        const yearClass = yearHasFuture ? "is-future" : yearHasToday ? "is-today" : "";
        return (
          <div key={year} className={`year-section ${yearClass}`}>
            <div className={`year-box-hdr ${yearClass}`} onClick={() => toggleGroup(year)}>
              <ChevronDown size={20} className={collapsed[year] ? "group-ico collapsed" : "group-ico"} />
              <h3>Ano {year}</h3>
            </div>

            {!collapsed[year] && (
              <div className="year-content">
                {Object.keys(grouped[year]).sort((a, b) => {
                  const monthsOrder = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                  return monthsOrder.indexOf(b) - monthsOrder.indexOf(a);
                }).map(month => {
                  const mKey = `${year}-${month}`;
                  const monthBookings = grouped[year][month];
                  const hasFuture = anyFutureInGroup(monthBookings);
                  const hasToday = !hasFuture && anyTodayInGroup(monthBookings);
                  const isCurrentCalMonth = year === currentYearStr && month === currentMonthKey;
                  const monthClass = isCurrentCalMonth ? "is-today" : hasFuture ? "is-future" : hasToday ? "is-today" : "";
                  return (
                    <div key={mKey} className={`month-section ${monthClass}`}>
                      <div className={`month-box-hdr ${monthClass}`} onClick={() => toggleGroup(mKey)}>
                        <div className="month-title">
                          <ChevronDown size={14} className={collapsed[mKey] ? "group-ico collapsed" : "group-ico"} />
                          {month}
                        </div>
                        <div className="month-hdr-right">
                          <button
                            className={`btn-dayview${dayViewMonths[mKey] ? " active" : ""}`}
                            title={dayViewMonths[mKey] ? "Vista de lista" : "Vista por dia"}
                            onClick={e => { e.stopPropagation(); toggleDayView(mKey); }}
                          >
                            <CalendarDays size={13} />
                          </button>
                          <span className="month-badge">{monthBookings.length} {monthBookings.length === 1 ? 'reserva' : 'reservas'}</span>
                        </div>
                      </div>

                      {!collapsed[mKey] && (
                        dayViewMonths[mKey] ? (
                          <div className="day-groups">
                            {Object.entries(
                              monthBookings.reduce((acc: Record<string, Booking[]>, b) => {
                                const d = b.activityDate.slice(0, 10);
                                if (!acc[d]) acc[d] = [];
                                acc[d].push(b);
                                return acc;
                              }, {})
                            ).sort(([a], [b]) => b.localeCompare(a)).map(([dayKey, dayBookings]) => {
                              const dayDate = new Date(dayKey + "T12:00:00");
                              const dayStr = format(dayDate, "EEEE, d 'de' MMMM", { locale: pt });
                              const dKey = `${mKey}-${dayKey}`;
                              return (
                                <div key={dayKey} className="day-section">
                                  <div className="day-hdr" style={{ cursor: "pointer" }} onClick={() => toggleDay(dKey)}>
                                    <span className="day-hdr-title">
                                      <ChevronDown size={12} className={collapsedDays[dKey] ? "group-ico collapsed" : "group-ico"} style={{ marginRight: 6, verticalAlign: "middle" }} />
                                      {dayStr.charAt(0).toUpperCase() + dayStr.slice(1)}
                                    </span>
                                    <span className="day-badge">{dayBookings.length} {dayBookings.length === 1 ? 'reserva' : 'reservas'}</span>
                                  </div>
                                  {!collapsedDays[dKey] && (
                                    <>
                                      {renderBookingTable(dayBookings)}
                                      {renderBookingCards(dayBookings)}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <>
                            {renderBookingTable(monthBookings)}
                            {renderBookingCards(monthBookings)}
                          </>
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
