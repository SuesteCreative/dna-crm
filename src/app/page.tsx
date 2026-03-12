"use client";

export const dynamic = "force-dynamic";

import { useUser, useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

import { exportToExcel, exportToPDF } from "@/lib/export";
import { 
  Booking, Service, Partner, SlotInfo 
} from "@/components/dashboard/types";
import { 
  PARTNER_PALETTE, recalcPrice 
} from "@/components/dashboard/DashboardHelpers";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatsSection } from "@/components/dashboard/StatsSection";
import { DashboardSearch } from "@/components/dashboard/DashboardSearch";
import { BookingList } from "@/components/dashboard/BookingList";
import { BookingModals } from "@/components/dashboard/BookingModals";

const defaultForm = {
  customerName: "", customerEmail: "", customerPhone: "", countryCode: "+351",
  activityDate: "", activityTime: "", pax: 1, quantity: 1, totalPrice: "",
  serviceId: "", activityType: "", discountAmount: "", discountType: "%",
  forPartnerId: "", bookingFee: "",
};

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { sessionClaims } = useAuth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  const partnerId = (sessionClaims as any)?.metadata?.partnerId as string | undefined;
  const isPartner = role === "PARTNER";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(defaultForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [attendanceTarget, setAttendanceTarget] = useState<Booking | null>(null);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [expandedGhosts, setExpandedGhosts] = useState<Record<string, boolean>>({});
  const toggleGhost = (id: string) => setExpandedGhosts(prev => ({ ...prev, [id]: !prev[id] }));
  const [dayViewMonths, setDayViewMonths] = useState<Record<string, boolean>>({});
  const toggleDayView = (key: string) => setDayViewMonths(prev => ({ ...prev, [key]: !prev[key] }));
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const toggleDay = (key: string) => setCollapsedDays(prev => ({ ...prev, [key]: !prev[key] }));
  const [createUnitPrice, setCreateUnitPrice] = useState<number | null>(null);
  const [editUnitPrice, setEditUnitPrice] = useState<number | null>(null);
  const [slots, setSlots] = useState<SlotInfo[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsClosed, setSlotsClosed] = useState(false);
  const [canOverride, setCanOverride] = useState(false);
  const [overrideModal, setOverrideModal] = useState<{ time: string; available: number; capacity: number } | null>(null);
  const [overrideType, setOverrideType] = useState<'create' | 'edit'>('create');
  const [overrideReason, setOverrideReason] = useState("");
  const [statsCollapsed, setStatsCollapsed] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 1024) {
      setStatsCollapsed(false);
    }
  }, []);

  useEffect(() => {
    const isAnyModalOpen = showModal || !!editTarget || !!attendanceTarget || !!overrideModal;
    document.body.classList.toggle("modal-open", isAnyModalOpen);
    return () => document.body.classList.remove("modal-open");
  }, [showModal, editTarget, attendanceTarget, overrideModal]);

  useEffect(() => {
    if (isSignedIn) {
      fetchBookings();
      fetchServices();
      fetchPartners();
    }
  }, [isSignedIn]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (isSignedIn) fetchBookings(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search, isSignedIn]);

  // Rest of the logic from original c:\Users\pedro\OneDrive\Desportos Náuticos de Alvor\CRM\src\app\page.tsx 
  // (fetchBookings, handleSync, etc.) 
  // I will re-paste them here, but keeping it concise where possible.

  const fetchBookings = async (query?: string) => {
    setLoading(true);
    try {
      const url = query ? `/api/bookings?search=${encodeURIComponent(query)}` : "/api/bookings";
      const res = await fetch(url);
      if (!res.ok) { 
        setBookings([]);
        setFiltered([]);
        return; 
      }
      const data = await res.json();
      const bks = Array.isArray(data) ? data : [];
      setBookings(bks);
      setFiltered(bks);
    } catch { 
      setBookings([]); 
      setFiltered([]);
    }
    finally { setLoading(false); }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch { }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/partners");
      if (res.ok) {
        const data = await res.json();
        setPartners(Array.isArray(data) ? data : []);
      }
    } catch { }
  };

  const fetchSlots = async (serviceId: string, date: string, quantity: number, excludeBookingId?: string) => {
    if (!serviceId || !date) { setSlots([]); return; }
    const svc = services.find(s => s.id === serviceId);
    if (!svc?.durationMinutes) { setSlots([]); return; }
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/slots?serviceId=${serviceId}&date=${date}&quantity=${quantity}${excludeBookingId ? `&excludeBookingId=${excludeBookingId}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setSlotsClosed(data.closed ?? false);
        setCanOverride(data.canOverride ?? false);
        setSlots(data.slots || []);
      }
    } catch { }
    finally { setSlotsLoading(false); }
  };

  const handleSync = async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const res = await fetch("/api/shopify/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        let msg = `Sincronizado: ${data.count} importadas`;
        if (data.failed > 0) msg += `, ${data.failed} falhas`;
        msg += ` (${data.debugInfo.domain})`;
        setSyncMsg(msg);
        await fetchBookings();
      } else {
        setSyncMsg(`Erro: ${data.error}`);
      }
    } catch { setSyncMsg("Erro de ligação"); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(null), 4000); }
  };

  const handleGcalSync = async () => {
    setGcalSyncing(true); setSyncMsg(null);
    try {
      const res = await fetch("/api/admin/gcal/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncMsg("Calendários sincronizados com sucesso");
      } else {
        setSyncMsg(`Erro GCal: ${data.error}`);
      }
    } catch { setSyncMsg("Erro de ligação GCal"); }
    finally { setGcalSyncing(false); setTimeout(() => setSyncMsg(null), 4000); }
  };

  const toggleGroup = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (bookings.length === 0) return;
    const currentYear = new Date().getFullYear().toString();
    setCollapsed(prev => {
      const next = { ...prev };
      bookings.forEach(b => {
        const y = new Date(b.activityDate).getFullYear().toString();
        if (y < currentYear && !(y in prev)) next[y] = true;
      });
      return next;
    });
  }, [bookings]);

  const grouped = useMemo(() => {
    const groups: Record<string, Record<string, Booking[]>> = {};
    const sorted = [...filtered].sort((a, b) => {
      const da = a.activityDate + "T" + (a.activityTime || "00:00");
      const db = b.activityDate + "T" + (b.activityTime || "00:00");
      return db.localeCompare(da);
    });
    sorted.forEach(b => {
      const date = new Date(b.activityDate);
      const year = date.getFullYear().toString();
      const monthDisplay = format(date, "MMMM", { locale: pt });
      const monthKey = monthDisplay.charAt(0).toUpperCase() + monthDisplay.slice(1);
      if (!groups[year]) groups[year] = {};
      if (!groups[year][monthKey]) groups[year][monthKey] = [];
      groups[year][monthKey].push(b);
    });
    return groups;
  }, [filtered]);

  const years = useMemo(() => Object.keys(grouped).sort((a, b) => b.localeCompare(a)), [grouped]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = (b: Booking) => {
    const d = new Date(b.activityDate);
    return d >= todayStart && d < tomorrow;
  };
  const isFuture = (b: Booking) => new Date(b.activityDate) >= tomorrow;
  
  const isNoShow = (b: Booking) =>
    new Date(b.activityDate) < todayStart && b.status !== "CANCELLED" && !b.showedUp;

  const anyTodayInGroup = (bookings: Booking[]) => bookings.some(isToday);
  const anyFutureInGroup = (bookings: Booking[]) => bookings.some(isFuture);

  const anyTodayInYear = (year: string) =>
    Object.values(grouped[year] || {}).some(monthList => anyTodayInGroup(monthList));
  const anyFutureInYear = (year: string) =>
    Object.values(grouped[year] || {}).some(monthList => anyFutureInGroup(monthList));

  const currentYearStr = todayStart.getFullYear().toString();
  const _cmRaw = format(todayStart, "MMMM", { locale: pt });
  const currentMonthKey = _cmRaw.charAt(0).toUpperCase() + _cmRaw.slice(1);

  const applyQuickCommission = () => {
    const pId = isPartner ? partnerId : formData.forPartnerId;
    const partner = partners.find(p => p.id === pId);
    if (!partner) return;
    const svc = services.find(s => s.id === formData.serviceId);
    const multiplier = svc?.minPax != null ? formData.pax : formData.quantity;
    const base = (createUnitPrice || 0) * multiplier;
    const d = parseFloat(formData.discountAmount) || 0;
    let discounted = base;
    if (d > 0) {
      discounted = formData.discountType === "%" ? base * (1 - d / 100) : base - d;
    }
    const calculatedFee = (discounted * (partner.commission / 100)).toFixed(2);
    setFormData({
      ...formData,
      bookingFee: calculatedFee,
      totalPrice: recalcPrice(createUnitPrice, multiplier, formData.discountAmount, formData.discountType, calculatedFee)
    });
  };

  const applyEditQuickCommission = () => {
    const pId = isPartner ? partnerId : (editForm.forPartnerId || editTarget?.partnerId);
    const partner = partners.find(p => p.id === pId);
    if (!partner) return;
    const svc = services.find(s => (s.variant ? `${s.name} — ${s.variant}` : s.name) === editForm.activityType);
    const multiplier = svc?.minPax != null ? editForm.pax : editForm.quantity;
    const base = (editUnitPrice || 0) * multiplier;
    const d = parseFloat(editForm.discountAmount) || 0;
    let discounted = base;
    if (d > 0) {
      discounted = editForm.discountType === "%" ? base * (1 - d / 100) : base - d;
    }
    const calculatedFee = (discounted * (partner.commission / 100)).toFixed(2);
    setEditForm({
      ...editForm,
      bookingFee: calculatedFee,
      totalPrice: recalcPrice(editUnitPrice, multiplier, editForm.discountAmount, editForm.discountType, calculatedFee)
    });
  };

  const handleServiceSelect = (serviceId: string) => {
    const svc = services.find(s => s.id === serviceId);
    if (!svc) {
      setCreateUnitPrice(null);
      setSlots([]);
      setFormData({ ...formData, serviceId: "", activityType: "", totalPrice: "", activityTime: "" });
      return;
    }
    const label = svc.variant ? `${svc.name} — ${svc.variant}` : svc.name;
    const unitPrice = svc.price ?? null;
    setCreateUnitPrice(unitPrice);
    const isPaxPriced = svc.minPax != null;
    const initPax = svc.minPax ?? formData.pax;
    const initQty = isPaxPriced ? 1 : formData.quantity;
    const multiplier = isPaxPriced ? initPax : initQty;
    const newForm = {
      ...formData,
      serviceId: svc.id,
      activityType: label,
      activityTime: svc.durationMinutes ? "" : formData.activityTime,
      pax: initPax,
      quantity: initQty,
      totalPrice: recalcPrice(unitPrice, multiplier, formData.discountAmount, formData.discountType, formData.bookingFee),
    };
    setFormData(newForm);
    if (svc.durationMinutes && formData.activityDate) {
      fetchSlots(svc.id, formData.activityDate, initQty);
    } else {
      setSlots([]);
    }
  };

  const submitCreate = async (override = false, reason = "") => {
    if (submitting) return;
    if (!formData.activityTime) {
      setFormError("Por favor, selecione um horário.");
      return;
    }
    setSubmitting(true); setFormError(null);
    try {
      const { discountAmount, discountType, ...payload } = formData;
      const body: Record<string, any> = { ...payload };
      if (!payload.forPartnerId) delete body.forPartnerId;
      if (override) {
        body.override = true;
        body.overrideReason = reason;
        body.userName = user?.fullName || "Staff";
      }
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setShowModal(false); setFormData(defaultForm); setSlots([]); setOverrideModal(null); setOverrideReason("");
        fetchBookings();
      } else {
        const d = await res.json();
        if (d.error === "SLOT_FULL" && d.canOverride) {
          setOverrideType("create");
          setOverrideModal({ time: formData.activityTime, available: d.available, capacity: d.capacity });
        } else if (d.error === "SLOT_FULL") {
          setFormError(`Slot sem disponibilidade (${d.available}/${d.capacity} livres)`);
        } else { setFormError(d.error || "Erro ao criar reserva"); }
      }
    } catch { setFormError("Erro de ligação"); }
    finally { setSubmitting(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCreate(false, "");
  };

  const openEdit = (b: Booking) => {
    setEditTarget(b); setEditError(null);
    let unitPrice: number | null = null;
    const svcById = b.serviceId ? services.find(s => s.id === b.serviceId) : null;
    if (svcById?.price != null) { unitPrice = svcById.price; }
    else if (b.activityType) {
      const svcByType = services.find(s => {
        const labelSafe = s.variant ? `${s.name} — ${s.variant}` : s.name;
        const labelLegacy = s.variant ? `${s.name} - ${s.variant}` : s.name;
        return labelSafe === b.activityType || labelLegacy === b.activityType;
      });
      unitPrice = svcByType?.price ?? null;
    }
    setEditUnitPrice(unitPrice);
    const d = new Date(b.activityDate);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setEditForm({
      customerName: b.customerName,
      customerEmail: b.customerEmail || "",
      customerPhone: b.customerPhone || "",
      activityDate: dateStr,
      activityTime: b.activityTime || "",
      pax: b.pax,
      quantity: b.quantity ?? 1,
      totalPrice: b.totalPrice ?? "",
      activityType: b.activityType || "",
      status: b.status,
      notes: b.notes || "",
      countryCode: b.country || "Other",
      bookingFee: b.bookingFee?.toString() || "",
      forPartnerId: b.partnerId || "",
      discountAmount: "",
      discountType: "%",
    });

    const targetSvcId = svcById?.id || services.find(s => {
      const labelSafe = s.variant ? `${s.name} — ${s.variant}` : s.name;
      const labelLegacy = s.variant ? `${s.name} - ${s.variant}` : s.name;
      return labelSafe === b.activityType || labelLegacy === b.activityType;
    })?.id;
    if (targetSvcId) fetchSlots(targetSvcId, dateStr, b.quantity ?? 1, b.id);
  };

  const handleEditSave = async (override = false, reason = "") => {
    if (!editTarget) return;
    setEditSaving(true); setEditError(null);
    try {
      const { discountAmount, discountType, ...editPayload } = editForm;
      const res = await fetch("/api/bookings/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editTarget.id, ...editPayload, override, overrideReason: reason, userName: user?.fullName || "Staff",
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBookings(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
        setEditTarget(null); setOverrideModal(null); setOverrideReason("");
      } else {
        const d = await res.json();
        if (d.error === "SLOT_FULL") {
          if (d.canOverride) {
            setOverrideType("edit");
            setOverrideModal({ time: editForm.activityTime || "", available: d.available, capacity: d.capacity });
          } else { setEditError("Este horário está lotado."); }
        } else { setEditError(d.error || "Erro ao guardar"); }
      }
    } catch { setEditError("Erro de ligação"); }
    finally { setEditSaving(false); }
  };

  const handleEditDelete = async () => {
    if (!editTarget) return;
    if (!confirm(`Eliminar reserva de ${editTarget.customerName}?`)) return;
    try {
      const res = await fetch(`/api/bookings/delete?id=${editTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== editTarget.id));
        setEditTarget(null);
      } else { alert("Erro ao eliminar reserva"); }
    } catch { alert("Erro de ligação"); }
  };

  const handleAttendance = async (booking: Booking) => {
    const newValue = !booking.showedUp;
    setAttendanceSaving(true);
    try {
      const res = await fetch("/api/bookings/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: booking.id, showedUp: newValue }),
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, showedUp: newValue } : b));
      }
    } catch { }
    finally { setAttendanceSaving(false); setAttendanceTarget(null); }
  };

  const partnerColorMap = useMemo(() => new Map(
    partners.map((p, i) => [p.id, PARTNER_PALETTE[i % PARTNER_PALETTE.length]])
  ), [partners]);

  const svcGroups = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    for (const s of services) {
      const cat = s.category || "Outros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    }
    return groups;
  }, [services]);

  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === "CONFIRMED").length;
    const noShows = bookings.filter(isNoShow);
    const revenue = bookings
      .filter(b => b.status !== "CANCELLED" && !isNoShow(b))
      .reduce((s, b) => s + (b.totalPrice || 0), 0);
    const projectedRevenue = bookings
      .filter(b => b.status !== "CANCELLED" && (isFuture(b) || isToday(b)))
      .reduce((s, b) => s + (b.totalPrice || 0), 0);
    const noShowByPartner = partners
      .map(p => ({ name: p.name, id: p.id, count: noShows.filter(b => b.partnerId === p.id).length }))
      .filter(p => p.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const noShowByChannel = (["SHOPIFY", "MANUAL", "PARTNER"] as const)
      .map(src => ({ src, count: noShows.filter(b => b.source === src).length }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count);

    return { confirmed, noShows, revenue, projectedRevenue, noShowByPartner, noShowByChannel };
  }, [bookings, partners]);

  if (!isLoaded) return <div className="loading-screen"><div className="loader" /></div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  const todayStr = todayStart.toISOString().split("T")[0];

  return (
    <main className="crm-main">
      <DashboardHeader 
        isPartner={isPartner}
        exportToExcel={() => exportToExcel(bookings, "reservas-dna")}
        exportToPDF={() => exportToPDF(bookings, "reservas-dna")}
        handleSync={handleSync}
        syncing={syncing}
        handleGcalSync={handleGcalSync}
        gcalSyncing={gcalSyncing}
        setShowModal={setShowModal}
        setSlots={setSlots}
        setFormData={setFormData}
        setCreateUnitPrice={setCreateUnitPrice}
        defaultForm={defaultForm}
        syncMsg={syncMsg}
      />

      <StatsSection 
        bookings={bookings}
        partners={partners}
        confirmed={stats.confirmed}
        noShows={stats.noShows}
        revenue={stats.revenue}
        projectedRevenue={stats.projectedRevenue}
        noShowByPartner={stats.noShowByPartner}
        noShowByChannel={stats.noShowByChannel}
        statsCollapsed={statsCollapsed}
        setStatsCollapsed={setStatsCollapsed}
        isPartner={isPartner}
        partnerColorMap={partnerColorMap}
        PARTNER_PALETTE={PARTNER_PALETTE}
      />

      <section className="dashboard-content">
        <DashboardSearch search={search} setSearch={setSearch} />

        {loading ? (
          <div className="table-empty"><div className="loader-sm" /></div>
        ) : years.length === 0 ? (
          <div className="table-empty">Nenhuma reserva encontrada.</div>
        ) : (
          <BookingList 
            bookings={bookings}
            years={years}
            grouped={grouped}
            collapsed={collapsed}
            toggleGroup={toggleGroup}
            dayViewMonths={dayViewMonths}
            toggleDayView={toggleDayView}
            collapsedDays={collapsedDays}
            toggleDay={toggleDay}
            expandedGhosts={expandedGhosts}
            toggleGhost={toggleGhost}
            openEdit={openEdit}
            setAttendanceTarget={setAttendanceTarget}
            isPartner={isPartner}
            partners={partners}
            partnerColorMap={partnerColorMap}
            isToday={isToday}
            isFuture={isFuture}
            isNoShow={isNoShow}
            anyTodayInGroup={anyTodayInGroup}
            anyFutureInGroup={anyFutureInGroup}
            anyTodayInYear={anyTodayInYear}
            anyFutureInYear={anyFutureInYear}
            currentYearStr={currentYearStr}
            currentMonthKey={currentMonthKey}
          />
        )}
      </section>

      <BookingModals 
        showModal={showModal}
        setShowModal={setShowModal}
        formData={formData}
        setFormData={setFormData}
        formError={formError}
        handleCreate={handleCreate}
        submitting={submitting}
        svcGroups={svcGroups}
        handleServiceSelect={handleServiceSelect}
        slots={slots}
        slotsLoading={slotsLoading}
        slotsClosed={slotsClosed}
        canOverride={canOverride}
        isPartner={isPartner}
        todayStr={todayStr}
        createUnitPrice={createUnitPrice}
        applyQuickCommission={applyQuickCommission}
        partners={partners}
        editTarget={editTarget}
        setEditTarget={setEditTarget}
        editForm={editForm}
        setEditForm={setEditForm}
        editSaving={editSaving}
        editError={editError}
        handleEditSave={handleEditSave}
        handleEditDelete={handleEditDelete}
        editUnitPrice={editUnitPrice}
        setEditUnitPrice={setEditUnitPrice}
        applyEditQuickCommission={applyEditQuickCommission}
        fetchSlots={fetchSlots}
        services={services}
        attendanceTarget={attendanceTarget}
        setAttendanceTarget={setAttendanceTarget}
        attendanceSaving={attendanceSaving}
        handleAttendance={handleAttendance}
        overrideModal={overrideModal}
        setOverrideModal={setOverrideModal}
        overrideType={overrideType}
        overrideReason={overrideReason}
        setOverrideReason={setOverrideReason}
        submitCreate={submitCreate}
      />
    </main>
  );
}
