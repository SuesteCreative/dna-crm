import React from "react";
import { 
  X, AlertCircle, Zap, UserCheck, Trash2, Plus
} from "lucide-react";
import { CountrySelector } from "@/components/CountrySelector";
import { Booking, Service, SlotInfo, Partner } from "./types";
import { recalcPrice } from "./DashboardHelpers";

interface BookingModalsProps {
  // Create Modal
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  formData: any;
  setFormData: (data: any | ((prev: any) => any)) => void;
  formError: string | null;
  handleCreate: (e: React.FormEvent) => void;
  submitting: boolean;
  svcGroups: Record<string, Service[]>;
  handleServiceSelectForActivity: (index: number, id: string) => void;
  fetchSlotsForActivity: (index: number, svcId: string, date: string, qty: number, excludeId?: string) => void;
  slots: SlotInfo[];
  slotsLoading: boolean;
  slotsClosed: boolean;
  canOverride: boolean;
  isPartner: boolean;
  todayStr: string;
  applyQuickCommission: () => void;
  partners: Partner[];
  services: Service[];
  
  // Edit Drawer
  editTarget: Booking | null;
  setEditTarget: (b: Booking | null) => void;
  editForm: any;
  setEditForm: (data: any) => void;
  editSaving: boolean;
  editError: string | null;
  handleEditSave: (override?: boolean, reason?: string) => void;
  handleEditDelete: () => void;
  editUnitPrice: number | null;
  setEditUnitPrice: (price: number | null) => void;
  applyEditQuickCommission: () => void;
  fetchSlots: (svcId: string, date: string, qty: number, excludeId?: string) => void;

  // Attendance Modal
  attendanceTarget: Booking | null;
  setAttendanceTarget: (b: Booking | null) => void;
  attendanceSaving: boolean;
  handleAttendance: (b: Booking) => void;

  // Override Modal
  overrideModal: { time: string; available: number; capacity: number } | null;
  setOverrideModal: (m: any) => void;
  overrideType: "create" | "edit";
  overrideReason: string;
  setOverrideReason: (r: string) => void;
  submitCreate: (override: boolean, reason: string) => void;
}

const defaultActivity = {
  serviceId: "", activityDate: "", activityTime: "", pax: 1, quantity: 1,
  activityType: "", discountAmount: "", discountType: "%",
  createUnitPrice: null, slots: [], slotsLoading: false, slotsClosed: false,
  totalPrice: 0
};

export const BookingModals: React.FC<BookingModalsProps> = ({
  showModal, setShowModal, formData, setFormData, formError, handleCreate, submitting, svcGroups, handleServiceSelectForActivity, fetchSlotsForActivity, slots, slotsLoading, slotsClosed, canOverride, isPartner, todayStr, applyQuickCommission, partners,
  editTarget, setEditTarget, editForm, setEditForm, editSaving, editError, handleEditSave, handleEditDelete, editUnitPrice, setEditUnitPrice, applyEditQuickCommission, fetchSlots, services,
  attendanceTarget, setAttendanceTarget, attendanceSaving, handleAttendance,
  overrideModal, setOverrideModal, overrideType, overrideReason, setOverrideReason, submitCreate
}) => {
  const addActivity = () => {
    const first = formData.activities[0];
    setFormData((prev: any) => ({
      ...prev,
      activities: [
        ...prev.activities,
        { 
          ...defaultActivity, 
          activityDate: first?.activityDate || "", 
          activityTime: first?.activityTime || "" 
        }
      ]
    }));
  };

  const removeActivity = (index: number) => {
    if (formData.activities.length <= 1) return;
    setFormData((prev: any) => ({
      ...prev,
      activities: prev.activities.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateActivity = (index: number, updates: any) => {
    setFormData((prev: any) => {
      const acts = [...prev.activities];
      acts[index] = { ...acts[index], ...updates };
      return { ...prev, activities: acts };
    });
  };

  const addEditActivity = () => {
    const first = editForm.activities?.[0];
    setEditForm((prev: any) => ({
      ...prev,
      activities: [
        ...(prev.activities || []),
        {
          ...defaultActivity,
          activityDate: first?.activityDate || todayStr,
          activityTime: first?.activityTime || ""
        }
      ]
    }));
  };

  const removeEditActivity = (index: number) => {
    if (editForm.activities?.length <= 1) return;
    setEditForm((prev: any) => ({
      ...prev,
      activities: prev.activities.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateEditActivity = (index: number, fields: any) => {
    setEditForm((prev: any) => {
      const acts = [...(prev.activities || [])];
      acts[index] = { ...acts[index], ...fields };
      return { ...prev, activities: acts };
    });
  };

  const handleServiceSelectForEditActivity = (index: number, serviceId: string) => {
    const svc = services.find(s => s.id === serviceId);
    setEditForm((prev: any) => {
      const acts = [...(prev.activities || [])];
      const current = acts[index];
      if (!svc) {
        acts[index] = { ...current, serviceId: "", activityType: "", totalPrice: 0, activityTime: "", slots: [] };
      } else {
        const label = svc.variant ? `${svc.name} — ${svc.variant}` : svc.name;
        const multiplier = svc.minPax != null ? (current.pax || svc.minPax) : (current.quantity || 1);
        acts[index] = {
          ...current,
          serviceId: svc.id,
          activityType: label,
          activityTime: svc.durationMinutes ? "" : current.activityTime,
          pax: svc.minPax ?? current.pax,
          quantity: svc.minPax != null ? 1 : current.quantity,
          createUnitPrice: svc.price ?? null,
          totalPrice: (svc.price || 0) * multiplier
        };
        // Trigger slot fetch if needed
        if (svc.durationMinutes && current.activityDate) {
          fetchEditSlotsForActivity(index, svc.id, current.activityDate, acts[index].quantity, editTarget?.id);
        }
      }
      return { ...prev, activities: acts };
    });
  };

  const fetchEditSlotsForActivity = async (index: number, serviceId: string, date: string, quantity: number, excludeId?: string) => {
    updateEditActivity(index, { slotsLoading: true });
    try {
      const res = await fetch(`/api/slots?serviceId=${serviceId}&date=${date}&quantity=${quantity}${excludeId ? `&excludeBookingId=${excludeId}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        updateEditActivity(index, {
          slotsLoading: false,
          slotsClosed: data.closed ?? false,
          slots: data.slots || []
        });
      }
    } catch {
      updateEditActivity(index, { slotsLoading: false });
    }
  };

  const handleEditSaveInternal = (override = false, reason = "") => {
    // Total price is sum of activities
    const total = editForm.activities?.reduce((acc: number, cur: any) => acc + (parseFloat(cur.totalPrice) || 0), 0) || 0;
    handleEditSave(override, reason); 
  };

  return (
    <>
      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box multi-booking-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>Nova Reserva Manual</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              {formError && <div className="form-error"><AlertCircle size={14} />{formError}</div>}
              
              <div className="activities-list">
                {formData.activities.map((act: any, idx: number) => (
                  <div key={idx} className="activity-card">
                    <div className="activity-card-hdr">
                      <span className="activity-num">Atividade #{idx + 1}</span>
                      {formData.activities.length > 1 && (
                        <button type="button" className="btn-remove-act" onClick={() => removeActivity(idx)}>
                          <Trash2 size={14} /> Remover
                        </button>
                      )}
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label>Atividade / Serviço</label>
                        <select
                          className="field-select"
                          value={act.serviceId}
                          onChange={e => handleServiceSelectForActivity(idx, e.target.value)}
                        >
                          <option value="">— Selecionar atividade —</option>
                          {Object.entries(svcGroups).map(([cat, items]) => (
                            <optgroup key={cat} label={cat}>
                              {items.map(svc => (
                                <option key={svc.id} value={svc.id}>
                                  {svc.name}{svc.variant ? ` — ${svc.variant}` : ""}{svc.price ? ` (${svc.price}€)` : ""}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Data *</label>
                        <input type="date" value={act.activityDate} min={isPartner ? todayStr : undefined} onChange={e => {
                          const d = e.target.value;
                          updateActivity(idx, { activityDate: d, activityTime: "" });
                          if (act.serviceId) fetchSlotsForActivity(idx, act.serviceId, d, act.quantity);
                        }} required />
                      </div>

                      {(() => {
                        const svc = services.find(s => s.id === act.serviceId);
                        const isJetski = svc?.category === "Jetski" || svc?.name.toLowerCase().includes("jetski");
                        const isSofa = svc?.name.toLowerCase().includes("sofa");
                        const isBanana = svc?.name.toLowerCase().includes("banana");

                        if (isJetski) {
                          const qtyOptions = [1, 2, 3];
                          const minPax = act.quantity || 1;
                          const maxPax = (act.quantity || 1) * 2;
                          const paxOptions = Array.from({ length: maxPax - minPax + 1 }, (_, i) => minPax + i);

                          return (
                            <>
                              <div className="field">
                                <label>Quantidade (Motos)</label>
                                <select className="field-select" value={act.quantity} onChange={e => {
                                  const qty = parseInt(e.target.value);
                                  const newPax = Math.max(qty, Math.min(act.pax, qty * 2));
                                  updateActivity(idx, {
                                    quantity: qty,
                                    pax: newPax,
                                    totalPrice: recalcPrice(act.createUnitPrice, qty, act.discountAmount, act.discountType, "0")
                                  });
                                  if (act.serviceId && act.activityDate) fetchSlotsForActivity(idx, act.serviceId, act.activityDate, qty);
                                }}>
                                  {qtyOptions.map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                              </div>
                              <div className="field">
                                <label>Nº Pessoas</label>
                                <select className="field-select" value={act.pax} onChange={e => {
                                  updateActivity(idx, { pax: parseInt(e.target.value) });
                                }}>
                                  {paxOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </div>
                            </>
                          );
                        }

                        if (isSofa || isBanana) {
                          const maxPax = isSofa ? 6 : 8;
                          const paxOptions = Array.from({ length: maxPax - 1 }, (_, i) => 2 + i);
                          return (
                            <>
                              <div className="field">
                                <label>Quantidade</label>
                                <input type="number" value="1" disabled style={{ opacity: 0.6 }} />
                              </div>
                              <div className="field">
                                <label>Nº Pessoas</label>
                                <select className="field-select" value={act.pax} onChange={e => {
                                  const p = parseInt(e.target.value);
                                  updateActivity(idx, { quantity: 1, pax: p, totalPrice: recalcPrice(act.createUnitPrice, p, act.discountAmount, act.discountType, "0") });
                                }}>
                                  {paxOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </div>
                            </>
                          );
                        }

                        return (
                          <>
                            <div className="field">
                              <label>Quantidade</label>
                              <input type="number" min="1" value={act.quantity} onChange={e => {
                                const qty = parseInt(e.target.value) || 1;
                                const multiplier = svc?.minPax != null ? act.pax : qty;
                                updateActivity(idx, { quantity: qty, totalPrice: (act.createUnitPrice || 0) * multiplier });
                                if (act.serviceId && act.activityDate) fetchSlotsForActivity(idx, act.serviceId, act.activityDate, qty);
                              }} />
                            </div>
                            <div className="field">
                              <label>Nº Pessoas *</label>
                              <input type="number" min="1" value={act.pax} onChange={e => {
                                const p = parseInt(e.target.value) || 1;
                                const multiplier = svc?.minPax != null ? p : act.quantity;
                                updateActivity(idx, { pax: p, totalPrice: (act.createUnitPrice || 0) * multiplier });
                              }} required />
                            </div>
                          </>
                        );
                      })()}

                      <div className="field pricing-field">
                        <label>Preço Item (€)</label>
                        <input type="number" step="0.01" value={act.totalPrice} onChange={e => updateActivity(idx, { totalPrice: e.target.value })} />
                      </div>


                      {(() => {
                        const svc = services.find(s => s.id === act.serviceId);
                        if (svc?.durationMinutes && act.activityDate) {
                          return (
                            <div className="field full slot-picker-wrap">
                              <label>Horário {act.activityTime && <span className="slot-selected-label">— {act.activityTime} selecionado</span>}</label>
                              {act.slotsLoading ? (
                                <div className="slot-loading">A carregar horários...</div>
                              ) : act.slotsClosed ? (
                                <div className="slot-closed">Encerrado neste dia</div>
                              ) : (() => {
                                const slotGroups = [
                                  { label: "Manhã", slots: act.slots.filter((s: any) => { const [h] = s.time.split(":").map(Number); return h < 12; }) },
                                  { label: "Tarde", slots: act.slots.filter((s: any) => { const [h] = s.time.split(":").map(Number); return h >= 12 && h < 17; }) },
                                  { label: "Final", slots: act.slots.filter((s: any) => { const [h] = s.time.split(":").map(Number); return h >= 17; }) },
                                ].filter(g => g.slots.length > 0);
                                return (
                                  <div className="slot-groups">
                                    {slotGroups.map(group => (
                                      <div key={group.label} className="slot-grid">
                                        {group.slots.map((slot: any) => {
                                          const isSelected = act.activityTime === slot.time;
                                          let cls = "slot-btn " + (isSelected ? "slot-selected" : slot.blocked ? "slot-blocked" : "slot-free");
                                          if (slot.past) cls += " slot-past";
                                          return (
                                            <button
                                              key={slot.time} type="button" className={cls}
                                              disabled={slot.past || (slot.blocked && !canOverride)}
                                              onClick={() => updateActivity(idx, { activityTime: slot.time })}
                                            >
                                              {slot.time}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" className="btn-add-act" onClick={addActivity}>
                <Plus size={16} /> Adicionar Outra Atividade
              </button>

              <div className="form-grid customer-fields">
                <div className="field-section-label">Informação do Cliente</div>
                <div className="field">
                  <label>Nome do Cliente *</label>
                  <input value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
                </div>
                <div className="field">
                  <CountrySelector
                    label="País / Indicativo"
                    value={formData.countryCode}
                    onChange={val => setFormData({ ...formData, countryCode: val })}
                  />
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <input value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} />
                </div>

                {!isPartner && partners.length > 0 && (
                  <div className="field">
                    <label>Reserva em nome de parceiro (opcional)</label>
                    <select
                      className="field-select"
                      value={formData.forPartnerId}
                      onChange={e => setFormData({ ...formData, forPartnerId: e.target.value })}
                    >
                      <option value="">— Reserva direta (sem parceiro) —</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="field">
                  <label>Preço Total da Reserva (€)</label>
                  <div className="total-calc-wrap">
                    <input 
                      type="number" 
                      step="0.01" 
                      value={formData.totalPrice} 
                      readOnly 
                      className="field-readonly"
                      title="Calculado automaticamente"
                    />
                  </div>
                </div>

                {!isPartner && (
                  <>
                    <div className="field discount-row-main">
                      <label>Desconto Global</label>
                      <div className="discount-wrap">
                        <input
                          type="number" min="0" step="0.01" placeholder="0"
                          value={formData.discountAmount}
                          onChange={e => setFormData({ ...formData, discountAmount: e.target.value })}
                        />
                        <div className="discount-type-toggle">
                          <button type="button" className={formData.discountType === "%" ? "active" : ""} onClick={() => setFormData({ ...formData, discountType: "%" })}>%</button>
                          <button type="button" className={formData.discountType === "€" ? "active" : ""} onClick={() => setFormData({ ...formData, discountType: "€" })}>€</button>
                        </div>
                      </div>
                    </div>

                    <div className="field">
                      <label>Comissão (Booking Fee)</label>
                      <div className="booking-fee-wrap">
                        <input
                          type="number" step="0.01" placeholder="0.00"
                          value={formData.bookingFee}
                          onChange={e => setFormData({ ...formData, bookingFee: e.target.value })}
                        />
                        {partners.length > 0 && (
                          <button type="button" className="btn-quick-fee" onClick={applyQuickCommission} title="Aplicar comissão automática">
                            Calcular
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="field full">
                  <label>Notas Internas / Observações</label>
                  <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "A criar..." : "Criar Reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editTarget && (
        <>
          <div className="drawer-backdrop" onClick={() => setEditTarget(null)} />
          <aside className="edit-drawer">
            <div className="drawer-hdr">
              <div>
                <div className="drawer-title">{editTarget.customerName}</div>
                <div className="drawer-sub">
                  {editTarget.source === "SHOPIFY" && editTarget.orderNumber
                    ? `Shopify ${editTarget.orderNumber}`
                    : editTarget.source}
                </div>
              </div>
              <button className="modal-close" onClick={() => setEditTarget(null)}><X size={20} /></button>
            </div>

            <div className="drawer-original">
              <span className="drawer-original-label">Original</span>
              <span>{(editTarget.isEdited ? editTarget.originalActivityType : editTarget.activityType) || "—"}</span>
              <span className="attendance-dot">·</span>
              <span>{editTarget.isEdited ? editTarget.originalPax : editTarget.pax} pax</span>
              {(editTarget.isEdited ? editTarget.originalQuantity : editTarget.quantity) != null && <>
                <span className="attendance-dot">·</span>
                <span>{editTarget.isEdited ? editTarget.originalQuantity : editTarget.quantity}x</span>
              </>}
              <span className="attendance-dot">·</span>
              <span>{((editTarget.isEdited ? editTarget.originalTotalPrice : editTarget.totalPrice) ?? null) != null
                ? `${(editTarget.isEdited ? editTarget.originalTotalPrice! : editTarget.totalPrice!).toFixed(2)}€`
                : "—"}</span>
              {editTarget.isEdited && editTarget.originalActivityDate && <>
                <span className="attendance-dot">·</span>
                <span>{new Date(editTarget.originalActivityDate).toLocaleDateString("pt-PT")}</span>
                {editTarget.originalActivityTime && <>
                  <span className="attendance-dot">·</span>
                  <span>{editTarget.originalActivityTime}</span>
                </>}
              </>}
            </div>

            <div className="drawer-body">
              {editError && <div className="form-error"><AlertCircle size={14} />{editError}</div>}

              <div className="activities-list">
                {editForm.activities?.map((act: any, idx: number) => {
                  const svc = services.find(s => s.id === act.serviceId);
                  return (
                    <div key={idx} className="activity-card-edit">
                      <div className="activity-card-hdr">
                        <span className="activity-num">Item #{idx + 1}</span>
                        {editForm.activities.length > 1 && (
                          <button className="btn-remove-act" onClick={() => removeEditActivity(idx)}>
                            <Trash2 size={14} /> Remover
                          </button>
                        )}
                      </div>
                      
                      <div className="form-grid">
                        <div className="field full">
                          <label>Serviço</label>
                          <select
                            className="field-select"
                            value={act.serviceId}
                            onChange={e => handleServiceSelectForEditActivity(idx, e.target.value)}
                          >
                            <option value="">— Selecione Serviço —</option>
                            {Object.entries(svcGroups).map(([group, svcs]) => (
                              <optgroup key={group} label={group}>
                                {svcs.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.variant ? `${s.name} — ${s.variant}` : s.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div className="field">
                          <label>Data</label>
                          <input
                            type="date"
                            value={act.activityDate}
                            onChange={e => {
                              const newDate = e.target.value;
                              updateEditActivity(idx, { activityDate: newDate });
                              if (svc?.durationMinutes) fetchEditSlotsForActivity(idx, act.serviceId, newDate, act.quantity, editTarget?.id);
                            }}
                          />
                        </div>

                        <div className="field">
                          {svc?.minPax != null ? (
                            <>
                              <label>Pax</label>
                              <div className="pax-control">
                                <button type="button" onClick={() => {
                                  const val = Math.max(1, act.pax - 1);
                                  updateEditActivity(idx, { pax: val, totalPrice: (act.createUnitPrice || 0) * val });
                                }}>-</button>
                                <span>{act.pax}</span>
                                <button type="button" onClick={() => {
                                  const val = act.pax + 1;
                                  updateEditActivity(idx, { pax: val, totalPrice: (act.createUnitPrice || 0) * val });
                                }}>+</button>
                              </div>
                            </>
                          ) : (
                            <>
                              <label>Quantidade</label>
                              <input
                                type="number" min="1"
                                value={act.quantity}
                                onChange={e => {
                                  const val = parseInt(e.target.value) || 1;
                                  updateEditActivity(idx, { quantity: val, totalPrice: (act.createUnitPrice || 0) * val });
                                  if (svc?.durationMinutes) fetchEditSlotsForActivity(idx, act.serviceId, act.activityDate, val, editTarget?.id);
                                }}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {svc?.durationMinutes && (
                        <div className="field full">
                          <label>Horários Disponíveis {act.activityTime && <span className="slot-selected-label">— {act.activityTime}</span>}</label>
                          {act.slotsLoading ? (
                            <div className="slots-loading"><div className="loader-sm" /></div>
                          ) : act.slotsClosed ? (
                            <div className="slots-closed">Sem horários disponíveis para este dia.</div>
                          ) : (
                            <div className="slots-grid-sm">
                              {act.slots?.map((slot: any) => {
                                const isSelected = act.activityTime === slot.time;
                                return (
                                  <button
                                    key={slot.time}
                                    type="button"
                                    className={`slot-btn ${isSelected ? "slot-selected" : slot.blocked ? "slot-blocked" : "slot-free"}`}
                                    disabled={slot.past || (slot.blocked && (!canOverride || isPartner))}
                                    onClick={() => updateEditActivity(idx, { activityTime: slot.time })}
                                  >
                                    {slot.time}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button" className="btn-add-activity" onClick={addEditActivity}>
                  <Plus size={14} /> Adicionar Outra Atividade
                </button>
              </div>

              <div className="drawer-section-label" style={{ marginTop: 24 }}>Cliente</div>
              <div className="form-grid">
                <div className="field">
                  <label>Nome</label>
                  <input value={editForm.customerName} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input type="email" value={editForm.customerEmail} onChange={e => setEditForm({ ...editForm, customerEmail: e.target.value })} />
                </div>
                <div className="field">
                  <CountrySelector
                    label="País"
                    value={editForm.countryCode}
                    onChange={val => setEditForm({ ...editForm, countryCode: val })}
                  />
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <input value={editForm.customerPhone} onChange={e => setEditForm({ ...editForm, customerPhone: e.target.value })} />
                </div>
                <div className="field">
                  <label>Estado</label>
                  <select className="field-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="drawer-section-label" style={{ marginTop: 16 }}>Reserva</div>
              <div className="form-grid">

                {!isPartner && partners.length > 0 && (
                  <div className="field">
                    <label>Parceiro</label>
                    <select
                      className="field-select"
                      value={editForm.forPartnerId}
                      onChange={e => setEditForm({ ...editForm, forPartnerId: e.target.value })}
                    >
                      <option value="">— Sem parceiro —</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="field">
                  <label>Preço Total da Reserva (€)</label>
                  <div className="total-calc-wrap">
                    <input 
                      type="number" 
                      step="0.01" 
                      value={editForm.totalPrice} 
                      readOnly 
                      className="field-readonly"
                      title="Calculado automaticamente"
                    />
                  </div>
                </div>

                <div className="field discount-row-main">
                  <label>Desconto Global</label>
                  <div className="discount-wrap">
                    <input
                      type="number" min="0" step="0.01" placeholder="0"
                      value={editForm.discountAmount}
                      onChange={e => setEditForm({ ...editForm, discountAmount: e.target.value })}
                    />
                    <div className="discount-type-toggle">
                      <button type="button" className={editForm.discountType === "%" ? "active" : ""} onClick={() => setEditForm({ ...editForm, discountType: "%" })}>%</button>
                      <button type="button" className={editForm.discountType === "€" ? "active" : ""} onClick={() => setEditForm({ ...editForm, discountType: "€" })}>€</button>
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label>Comissão (Booking Fee)</label>
                  <div className="booking-fee-wrap">
                    <input
                      type="number" step="0.01" placeholder="0.00"
                      value={editForm.bookingFee}
                      onChange={e => setEditForm({ ...editForm, bookingFee: e.target.value })}
                    />
                    {(isPartner || partners.length > 0) && (
                      <button type="button" className="btn-quick-fee" onClick={applyEditQuickCommission} title="Aplicar comissão automática">
                        Calcular
                      </button>
                    )}
                  </div>
                </div>

                <div className="field full" style={{ marginTop: 8 }}>
                  <label>Notas Internas / Observações</label>
                  <textarea rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button className="btn-drawer-delete" onClick={handleEditDelete}>
                <Trash2 size={15} /> Eliminar
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => setEditTarget(null)}>Cancelar</button>
                <button className="btn-primary" disabled={editSaving} onClick={() => handleEditSave()}>
                  {editSaving ? "A guardar..." : "Guardar"}
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {overrideModal && (
        <div className="modal-backdrop">
          <div className="modal-box override-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>Slot Lotado — Override</h2>
              <button className="modal-close" onClick={() => setOverrideModal(null)}><X size={20} /></button>
            </div>
            <div className="override-info">
              <p>O slot das <strong>{overrideModal.time}</strong> está lotado ({overrideModal.available}/{overrideModal.capacity} livres).</p>
              <p>Como staff, pode forçar a reserva. Indique o motivo:</p>
            </div>
            <div className="field" style={{ margin: "0 0 16px" }}>
              <label>Motivo do override *</label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Ex: Cliente VIP, equipamento extra disponível..."
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setOverrideModal(null)}>Cancelar</button>
              <button
                className="btn-override-confirm"
                disabled={!overrideReason.trim()}
                onClick={() => {
                  if (overrideType === 'edit') handleEditSave(true, overrideReason);
                  else submitCreate(true, overrideReason);
                }}
              >
                Confirmar Override
              </button>
            </div>
          </div>
        </div>
      )}

      {attendanceTarget && (
        <div className="modal-backdrop" onClick={() => setAttendanceTarget(null)}>
          <div className="modal-box attendance-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAttendanceTarget(null)}><X size={20} /></button>
            <div className="attendance-icon-wrap">
              <UserCheck size={32} />
            </div>
            <div className="attendance-info">
              <div className="attendance-name">{attendanceTarget.customerName}</div>
              <div className="attendance-meta">
                <span>{attendanceTarget.pax} pax</span>
                <span className="attendance-dot">·</span>
                <span>
                  {attendanceTarget.activities && attendanceTarget.activities.length > 0 
                    ? attendanceTarget.activities.map((a: any) => a.activityType).join(" + ")
                    : (attendanceTarget.activityType || "—")
                  }
                </span>
                <span className="attendance-dot">·</span>
                <span className={`src-badge src-${attendanceTarget.source.toLowerCase()}`}>{attendanceTarget.source}</span>
              </div>
            </div>
            <p className="attendance-question">
              {attendanceTarget.showedUp ? "Este cliente NÃO compareceu?" : "Este cliente compareceu?"}
            </p>
            <div className="attendance-actions">
              <button className="btn-ghost" onClick={() => setAttendanceTarget(null)}>Cancelar</button>
              <button
                className={attendanceTarget.showedUp ? "btn-attendance-unmark" : "btn-attendance-confirm"}
                disabled={attendanceSaving}
                onClick={() => handleAttendance(attendanceTarget)}
              >
                <UserCheck size={16} />
                {attendanceSaving ? "A guardar..." : attendanceTarget.showedUp ? "Sim, desmarcar" : "Sim, compareceu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
