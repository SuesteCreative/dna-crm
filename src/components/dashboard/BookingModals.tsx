import React from "react";
import { 
  X, AlertCircle, Zap, UserCheck, Trash2 
} from "lucide-react";
import { CountrySelector } from "@/components/CountrySelector";
import { Booking, Service, SlotInfo, Partner } from "./types";
import { recalcPrice } from "./DashboardHelpers";

interface BookingModalsProps {
  // Create Modal
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  formError: string | null;
  handleCreate: (e: React.FormEvent) => void;
  submitting: boolean;
  svcGroups: Record<string, Service[]>;
  handleServiceSelect: (id: string) => void;
  slots: SlotInfo[];
  slotsLoading: boolean;
  slotsClosed: boolean;
  canOverride: boolean;
  isPartner: boolean;
  todayStr: string;
  createUnitPrice: number | null;
  applyQuickCommission: () => void;
  partners: Partner[];
  
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
  services: Service[];

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

export const BookingModals: React.FC<BookingModalsProps> = ({
  showModal, setShowModal, formData, setFormData, formError, handleCreate, submitting, svcGroups, handleServiceSelect, slots, slotsLoading, slotsClosed, canOverride, isPartner, todayStr, createUnitPrice, applyQuickCommission, partners,
  editTarget, setEditTarget, editForm, setEditForm, editSaving, editError, handleEditSave, handleEditDelete, editUnitPrice, setEditUnitPrice, applyEditQuickCommission, fetchSlots, services,
  attendanceTarget, setAttendanceTarget, attendanceSaving, handleAttendance,
  overrideModal, setOverrideModal, overrideType, overrideReason, setOverrideReason, submitCreate
}) => {
  return (
    <>
      {showModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-hdr">
              <h2>Nova Reserva Manual</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              {formError && <div className="form-error"><AlertCircle size={14} />{formError}</div>}
              <div className="form-grid">
                <div className="field-section-label">Atividade</div>

                <div className="field">
                  <label>Atividade / Serviço</label>
                  <select
                    className="field-select"
                    value={formData.serviceId}
                    onChange={e => handleServiceSelect(e.target.value)}
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
                  <label>Data da Atividade *</label>
                  <input type="date" value={formData.activityDate} min={isPartner ? todayStr : undefined} onChange={e => {
                    const d = e.target.value;
                    setFormData({ ...formData, activityDate: d, activityTime: "" });
                    if (formData.serviceId) fetchSlots(formData.serviceId, d, formData.quantity);
                  }} required />
                </div>

                {(() => {
                  const svc = services.find(s => s.id === formData.serviceId);
                  const isJetski = svc?.category === "Jetski" || svc?.name.toLowerCase().includes("jetski");
                  const isSofa = svc?.name.toLowerCase().includes("sofa");
                  const isBanana = svc?.name.toLowerCase().includes("banana");

                  if (isJetski) {
                    const qtyOptions = [1, 2, 3];
                    const minPax = formData.quantity;
                    const maxPax = formData.quantity * 2;
                    const paxOptions = Array.from({ length: maxPax - minPax + 1 }, (_, i) => minPax + i);

                    return (
                      <>
                        <div className="field">
                          <label>Quantidade (Motos)</label>
                          <select className="field-select" value={formData.quantity} onChange={e => {
                            const qty = parseInt(e.target.value);
                            setFormData({
                              ...formData,
                              quantity: qty,
                              pax: Math.max(qty, Math.min(formData.pax, qty * 2)),
                              totalPrice: recalcPrice(createUnitPrice, qty, formData.discountAmount, formData.discountType, formData.bookingFee)
                            });
                          }}>
                            {qtyOptions.map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                        <div className="field">
                          <label>Nº Pessoas</label>
                          <select className="field-select" value={formData.pax} onChange={e => {
                            const p = parseInt(e.target.value);
                            setFormData({ ...formData, pax: p });
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
                          <label>Quantidade (Sinal único)</label>
                          <input type="number" value="1" disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
                        </div>
                        <div className="field">
                          <label>Nº Pessoas</label>
                          <select className="field-select" value={formData.pax} onChange={e => {
                            const p = parseInt(e.target.value);
                            setFormData({ ...formData, quantity: 1, pax: p, totalPrice: recalcPrice(createUnitPrice, p, formData.discountAmount, formData.discountType, formData.bookingFee) });
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
                        <label>Quantidade (unidades)</label>
                        <input type="number" min="1" value={formData.quantity} onFocus={e => e.target.select()} onChange={e => {
                          const qty = parseInt(e.target.value) || 1;
                          const multiplier = svc?.minPax != null ? formData.pax : qty;
                          setFormData({ ...formData, quantity: qty, totalPrice: recalcPrice(createUnitPrice, multiplier, formData.discountAmount, formData.discountType, formData.bookingFee) });
                          if (formData.serviceId && formData.activityDate) fetchSlots(formData.serviceId, formData.activityDate, qty);
                        }} />
                      </div>
                      <div className="field">
                        <label>Nº Pessoas *</label>
                        <input
                          type="number" min="1"
                          value={formData.pax}
                          onFocus={e => e.target.select()}
                          onChange={e => {
                            const p = parseInt(e.target.value) || 1;
                            const multiplier = svc?.minPax != null ? p : formData.quantity;
                            setFormData({ ...formData, pax: p, totalPrice: recalcPrice(createUnitPrice, multiplier, formData.discountAmount, formData.discountType, formData.bookingFee) });
                          }}
                          required
                        />
                      </div>
                    </>
                  );
                })()}

                <div className="field">
                  <label>Preço Total (€)</label>
                  <input type="number" step="0.01" value={formData.totalPrice} onChange={e => setFormData({ ...formData, totalPrice: e.target.value })} />
                </div>

                <div className="field discount-row">
                  <label>Desconto</label>
                  <div className="discount-wrap">
                    <input
                      type="number" min="0" step="0.01" placeholder="0"
                      value={formData.discountAmount}
                      onChange={e => {
                        const discAmt = e.target.value;
                        const svc = services.find(s => s.id === formData.serviceId);
                        const multiplier = svc?.minPax != null ? formData.pax : formData.quantity;
                        setFormData({ ...formData, discountAmount: discAmt, totalPrice: recalcPrice(createUnitPrice, multiplier, discAmt, formData.discountType, formData.bookingFee) });
                      }}
                    />
                    <div className="discount-type-toggle">
                      <button type="button" className={formData.discountType === "%" ? "active" : ""} onClick={() => {
                        const svc = services.find(s => s.id === formData.serviceId);
                        const multiplier = svc?.minPax != null ? formData.pax : formData.quantity;
                        setFormData({ ...formData, discountType: "%", totalPrice: recalcPrice(createUnitPrice, multiplier, formData.discountAmount, "%", formData.bookingFee) });
                      }}>%</button>
                      <button type="button" className={formData.discountType === "€" ? "active" : ""} onClick={() => {
                        const svc = services.find(s => s.id === formData.serviceId);
                        const multiplier = svc?.minPax != null ? formData.pax : formData.quantity;
                        setFormData({ ...formData, discountType: "€", totalPrice: recalcPrice(createUnitPrice, multiplier, formData.discountAmount, "€", formData.bookingFee) });
                      }}>€</button>
                    </div>
                  </div>
                </div>

                {(() => {
                  const svc = services.find(s => s.id === formData.serviceId);
                  if (svc?.durationMinutes && formData.activityDate) {
                    return (
                      <div className="field full slot-picker-wrap">
                        <label>Horário {formData.activityTime && <span className="slot-selected-label">— {formData.activityTime} selecionado</span>}</label>
                        {slotsLoading ? (
                          <div className="slot-loading">A carregar horários...</div>
                        ) : slotsClosed ? (
                          <div className="slot-closed">Encerrado neste dia</div>
                        ) : (() => {
                          const slotGroups = [
                            { label: "Manhã", slots: slots.filter(s => { const [h] = s.time.split(":").map(Number); return h < 12; }) },
                            { label: "Tarde", slots: slots.filter(s => { const [h] = s.time.split(":").map(Number); return h >= 12 && h < 17; }) },
                            { label: "Final do dia", slots: slots.filter(s => { const [h] = s.time.split(":").map(Number); return h >= 17; }) },
                          ].filter(g => g.slots.length > 0);
                          return (
                            <div className="slot-groups">
                              {slotGroups.map(group => (
                                <div key={group.label} className="slot-group">
                                  <div className="slot-group-label">{group.label}</div>
                                  <div className="slot-grid">
                                    {group.slots.map(slot => {
                                      const isPast = !!slot.past;
                                      const isBlocked = slot.blocked;
                                      const isSelected = formData.activityTime === slot.time;
                                      let cls = "slot-btn";
                                      if (isSelected) cls += " slot-selected";
                                      else if (isPast) cls += " slot-past";
                                      else if (isBlocked) cls += canOverride && !isPartner ? " slot-override" : " slot-blocked";
                                      else cls += " slot-free";
                                      return (
                                        <button
                                          key={slot.time}
                                          type="button"
                                          className={cls}
                                          disabled={isPast || (isBlocked && (!canOverride || isPartner))}
                                          onClick={() => {
                                            if (isPast || (isBlocked && (!canOverride || isPartner))) return;
                                            setFormData({ ...formData, activityTime: slot.time });
                                          }}
                                          title={isPast ? "Horário já passou" : isBlocked ? `Lotado (${slot.available}/${slot.capacity} livres)` : `${slot.available}/${slot.capacity} livres`}
                                        >
                                          {slot.time}
                                          {isBlocked && !isPartner && canOverride && !isPast && <span className="slot-override-tag">Override</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }
                  return (
                    <div className="field">
                      <label>Hora</label>
                      <input type="time" value={formData.activityTime} onChange={e => setFormData({ ...formData, activityTime: e.target.value })} />
                    </div>
                  );
                })()}

                <div className="field-section-label" style={{ marginTop: 8 }}>Cliente</div>
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

                <div className="field-section-label" style={{ marginTop: 8 }}>Reserva</div>
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
                  <label>Comissão paga ao parceiro (Booking Fee)</label>
                  <div className="booking-fee-wrap">
                    <input
                      type="number" step="0.01" placeholder="0.00"
                      value={formData.bookingFee}
                      onChange={e => {
                        const fee = e.target.value;
                        const svc = services.find(s => s.id === formData.serviceId);
                        const multiplier = svc?.minPax != null ? formData.pax : formData.quantity;
                        setFormData({
                          ...formData,
                          bookingFee: fee,
                          totalPrice: recalcPrice(createUnitPrice, multiplier, formData.discountAmount, formData.discountType, fee)
                        });
                      }}
                    />
                    {(isPartner || formData.forPartnerId) && (
                      <button type="button" className="btn-quick-fee" onClick={applyQuickCommission} title="Aplicar comissão automática">
                        <Zap size={14} /> Quick Apply
                      </button>
                    )}
                    <span className="fee-hint">O preço total será ajustado (Preço - Comissão)</span>
                  </div>
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

              <div className="drawer-section-label">Atividade</div>
              <div className="form-grid">
                <div className="field">
                  <label>Tipo de atividade</label>
                  <select className="field-select" value={editForm.activityType} onChange={e => {
                    const val = e.target.value;
                    const svc = services.find(s => (s.variant ? `${s.name} — ${s.variant}` : s.name) === val);
                    const unitPrice = svc?.price ?? null;
                    setEditUnitPrice(unitPrice);
                    const isPaxPriced = svc?.minPax != null;
                    const multiplier = isPaxPriced ? editForm.pax : editForm.quantity;
                    const newPrice = recalcPrice(unitPrice, multiplier, editForm.discountAmount, editForm.discountType, editForm.bookingFee);
                    setEditForm({ ...editForm, activityType: val, totalPrice: newPrice || editForm.totalPrice });
                  }}>
                    <option value="">— Livre —</option>
                    {Object.entries(svcGroups).map(([cat, items]) => (
                      <optgroup key={cat} label={cat}>
                        {items.map(svc => (
                          <option key={svc.id} value={svc.variant ? `${svc.name} — ${svc.variant}` : svc.name}>
                            {svc.name}{svc.variant ? ` — ${svc.variant}` : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Data</label>
                  <input type="date" value={editForm.activityDate} onChange={e => {
                    const d = e.target.value;
                    setEditForm({ ...editForm, activityDate: d });
                    const svc = services.find(s => (s.variant ? `${s.name} — ${s.variant}` : s.name) === editForm.activityType);
                    const sId = svc?.id || editTarget?.serviceId;
                    if (sId) fetchSlots(sId, d, editForm.quantity || 1, editTarget?.id);
                  }} />
                </div>

                {(() => {
                  const svc = services.find(s => (s.variant ? `${s.name} — ${s.variant}` : s.name) === editForm.activityType);
                  const isJetski = svc?.category === "Jetski" || svc?.name.toLowerCase().includes("jetski");
                  const isSofa = svc?.name.toLowerCase().includes("sofa");
                  const isBanana = svc?.name.toLowerCase().includes("banana");

                  if (isJetski) {
                    const qtyOptions = [1, 2, 3];
                    const minPax = editForm.quantity || 1;
                    const maxPax = (editForm.quantity || 1) * 2;
                    const paxOptions = Array.from({ length: maxPax - minPax + 1 }, (_, i) => minPax + i);

                    return (
                      <>
                        <div className="field">
                          <label>Quantidade (Motos)</label>
                          <select className="field-select" value={editForm.quantity} onChange={e => {
                            const qty = parseInt(e.target.value);
                            const newPrice = recalcPrice(editUnitPrice, qty, editForm.discountAmount, editForm.discountType, editForm.bookingFee);
                            setEditForm({
                              ...editForm,
                              quantity: qty,
                              pax: Math.max(qty, Math.min(editForm.pax, qty * 2)),
                              totalPrice: newPrice || editForm.totalPrice
                            });
                            const svcId = svc?.id || editTarget?.serviceId;
                            if (svcId) fetchSlots(svcId, editForm.activityDate, qty, editTarget?.id);
                          }}>
                            {qtyOptions.map(q => <option key={q} value={q}>{q}</option>)}
                          </select>
                        </div>
                        <div className="field">
                          <label>Nº Pessoas</label>
                          <select className="field-select" value={editForm.pax} onChange={e => {
                            const p = parseInt(e.target.value);
                            setEditForm({ ...editForm, pax: p });
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
                          <label>Quantidade (Sinal único)</label>
                          <input type="number" value="1" disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
                        </div>
                        <div className="field">
                          <label>Nº Pessoas</label>
                          <select className="field-select" value={editForm.pax} onChange={e => {
                            const p = parseInt(e.target.value);
                            const newPrice = recalcPrice(editUnitPrice, p, editForm.discountAmount, editForm.discountType, editForm.bookingFee);
                            setEditForm({ ...editForm, quantity: 1, pax: p, totalPrice: newPrice || editForm.totalPrice });
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
                        <label>Quantidade (unidades)</label>
                        <input type="number" min="1" value={editForm.quantity} onFocus={e => e.target.select()} onChange={e => {
                          const qty = parseInt(e.target.value) || 1;
                          const multiplier = svc?.minPax != null ? editForm.pax : qty;
                          const newPrice = recalcPrice(editUnitPrice, multiplier, editForm.discountAmount, editForm.discountType, editForm.bookingFee);
                          setEditForm({ ...editForm, quantity: qty, totalPrice: newPrice || editForm.totalPrice });
                          const sId = svc?.id || editTarget?.serviceId;
                          if (sId) fetchSlots(sId, editForm.activityDate, qty, editTarget?.id);
                        }} />
                      </div>
                      <div className="field">
                        <label>Pax</label>
                        <input type="number" min="1" value={editForm.pax} onFocus={e => e.target.select()} onChange={e => {
                          const pax = parseInt(e.target.value) || 1;
                          const multiplier = svc?.minPax != null ? pax : editForm.quantity;
                          const newPrice = recalcPrice(editUnitPrice, multiplier, editForm.discountAmount, editForm.discountType, editForm.bookingFee);
                          setEditForm({ ...editForm, pax, totalPrice: newPrice || editForm.totalPrice });
                        }} />
                      </div>
                    </>
                  );
                })()}

                <div className="field price-display-row">
                  <label>Preço real (€)</label>
                  <div className="price-display-wrap">
                    <input type="number" step="0.01" value={editForm.totalPrice} onChange={e => setEditForm({ ...editForm, totalPrice: e.target.value })} />
                    {editUnitPrice != null && (
                      <span className="price-base-hint">{editUnitPrice}€ unid.</span>
                    )}
                  </div>
                </div>

                <div className="field discount-row">
                  <label>Desconto</label>
                  <div className="discount-wrap">
                    <input
                      type="number" min="0" step="0.01" placeholder="0"
                      value={editForm.discountAmount || ""}
                      onChange={e => {
                        const discAmt = e.target.value;
                        const svc = services.find(s => (s.variant ? `${s.name} — ${s.variant}` : s.name) === editForm.activityType);
                        const multiplier = svc?.minPax != null ? editForm.pax : editForm.quantity;
                        const newPrice = recalcPrice(editUnitPrice, multiplier, discAmt, editForm.discountType, editForm.bookingFee);
                        setEditForm({ ...editForm, discountAmount: discAmt, totalPrice: newPrice || editForm.totalPrice });
                      }}
                    />
                    <div className="discount-type-toggle">
                      <button type="button" className={(editForm.discountType || "%") === "%" ? "active" : ""} onClick={() => {
                        const svc = services.find(s => (s.variant ? `${s.name} — ${s.variant}` : s.name) === editForm.activityType);
                        const multiplier = svc?.minPax != null ? editForm.pax : editForm.quantity;
                        const newPrice = recalcPrice(editUnitPrice, multiplier, editForm.discountAmount, "%", editForm.bookingFee);
                        setEditForm({ ...editForm, discountType: "%", totalPrice: newPrice || editForm.totalPrice });
                      }}>%</button>
                      <button type="button" className={editForm.discountType === "€" ? "active" : ""} onClick={() => {
                        const svc = services.find(s => (s.variant ? `${s.name} — ${s.variant}` : s.name) === editForm.activityType);
                        const multiplier = svc?.minPax != null ? editForm.pax : editForm.quantity;
                        const newPrice = recalcPrice(editUnitPrice, multiplier, editForm.discountAmount, "€", editForm.bookingFee);
                        setEditForm({ ...editForm, discountType: "€", totalPrice: newPrice || editForm.totalPrice });
                      }}>€</button>
                    </div>
                  </div>
                </div>

                {(() => {
                  const svc = services.find(s => (s.variant ? `${s.name} — ${s.variant}` : s.name) === editForm.activityType);
                  if (svc?.durationMinutes && editForm.activityDate) {
                    return (
                      <div className="field full slot-picker-wrap">
                        <label>Hora {editForm.activityTime && <span className="slot-selected-label">— {editForm.activityTime} selecionada</span>}</label>
                        {slotsLoading ? (
                          <div className="slot-loading">A carregar horários...</div>
                        ) : slotsClosed ? (
                          <div className="slot-closed">Encerrado neste dia</div>
                        ) : (() => {
                          const slotGroups = [
                            { label: "Manhã", slots: slots.filter(s => { const [h] = s.time.split(":").map(Number); return h < 12; }) },
                            { label: "Tarde", slots: slots.filter(s => { const [h] = s.time.split(":").map(Number); return h >= 12 && h < 17; }) },
                            { label: "Final do dia", slots: slots.filter(s => { const [h] = s.time.split(":").map(Number); return h >= 17; }) },
                          ].filter(g => g.slots.length > 0);
                          return (
                            <div className="slot-groups">
                              {slotGroups.map(group => (
                                <div key={group.label} className="slot-group">
                                  <div className="slot-group-label">{group.label}</div>
                                  <div className="slot-grid">
                                    {group.slots.map(slot => {
                                      const isPast = !!slot.past;
                                      const isBlocked = slot.blocked;
                                      const isSelected = editForm.activityTime === slot.time;
                                      let cls = "slot-btn";
                                      if (isSelected) cls += " slot-selected";
                                      else if (isPast) cls += " slot-past";
                                      else if (isBlocked) cls += canOverride && !isPartner ? " slot-override" : " slot-blocked";
                                      else cls += " slot-free";
                                      return (
                                        <button
                                          key={slot.time}
                                          type="button"
                                          className={cls}
                                          disabled={isPast || (isBlocked && (!canOverride || isPartner))}
                                          onClick={() => {
                                            if (isPast || (isBlocked && (!canOverride || isPartner))) return;
                                            setEditForm({ ...editForm, activityTime: slot.time });
                                          }}
                                          title={isPast ? "Horário já passou" : isBlocked ? `Lotado (${slot.available}/${slot.capacity} livres)` : `${slot.available}/${slot.capacity} livres`}
                                        >
                                          {slot.time}
                                          {isBlocked && !isPartner && canOverride && !isPast && <span className="slot-override-tag">Override</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }
                  return (
                    <div className="field">
                      <label>Hora</label>
                      <input type="time" value={editForm.activityTime} onChange={e => setEditForm({ ...editForm, activityTime: e.target.value })} />
                    </div>
                  );
                })()}
                <div className="field">
                  <label>Estado</label>
                  <select className="field-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="CONFIRMED">Confirmada</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CANCELLED">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="drawer-section-label" style={{ marginTop: 16 }}>Cliente</div>
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
                    label="País / Indicativo"
                    value={editForm.countryCode}
                    onChange={val => setEditForm({ ...editForm, countryCode: val })}
                  />
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <input value={editForm.customerPhone} onChange={e => setEditForm({ ...editForm, customerPhone: e.target.value })} />
                </div>
                <div className="field full">
                  <label>Notas</label>
                  <textarea rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
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
                  <label>Comissão (Booking Fee)</label>
                    <div className="booking-fee-wrap">
                      <input
                        type="number" step="0.01" placeholder="0.00"
                        value={editForm.bookingFee}
                        onChange={e => {
                          const fee = e.target.value;
                          const svc = services.find(s => (s.variant ? `${s.name} - ${s.variant}` : s.name) === editForm.activityType);
                          const multiplier = svc?.minPax != null ? editForm.pax : editForm.quantity;
                          const newPrice = recalcPrice(editUnitPrice, multiplier, editForm.discountAmount, editForm.discountType, fee);
                          setEditForm({ ...editForm, bookingFee: fee, totalPrice: newPrice || editForm.totalPrice });
                        }}
                      />
                      {(isPartner || editForm.forPartnerId || editTarget.partnerId) && (
                        <button type="button" className="btn-quick-fee" onClick={applyEditQuickCommission} title="Aplicar comissão automática">
                          <Zap size={14} /> Quick Apply
                        </button>
                      )}
                      <span className="fee-hint">O preço total será ajustado (Preço - Comissão)</span>
                    </div>
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
                <span>{attendanceTarget.activityType || "—"}</span>
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
