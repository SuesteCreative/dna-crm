"use client";
// Force rebuild - 13:35

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

const defaultActivity = {
  serviceId: "", activityDate: "", activityTime: "", pax: 1, quantity: 1,
  activityType: "",
  createUnitPrice: null as number | null,
  slots: [] as SlotInfo[], slotsLoading: false, slotsClosed: false,
  totalPrice: 0
};

const defaultForm = {
  customerName: "", customerEmail: "", customerPhone: "", countryCode: "PT",
  totalPrice: "", notes: "", forPartnerId: "", bookingFee: "0",
  discountAmount: "0", discountType: "%",
  activities: [{ ...defaultActivity }],
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
      // Background sync — fire and forget, debounced to once per 2h on the server
      fetch("/api/background-sync", { method: "POST" }).catch(() => {});
      fetchPartners();
    }
  }, [isSignedIn]);

  // AUTO-CALC TOTAL PRICE
  useEffect(() => {
    const sum = formData.activities.reduce((acc, act) => acc + (parseFloat(act.totalPrice as any) || 0), 0);
    const disc = parseFloat(formData.discountAmount) || 0;
    let final = sum;
    if (disc > 0) {
      final = formData.discountType === "%" ? sum * (1 - disc / 100) : sum - disc;
    }
    const fee = parseFloat(formData.bookingFee) || 0;
    setFormData(prev => ({ ...prev, totalPrice: Math.max(0, final - fee).toFixed(2) }));
  }, [formData.activities, formData.discountAmount, formData.discountType, formData.bookingFee]);

  // AUTO-CALC BOOKING FEE (ONLY RESET IF NO PARTNER)
  useEffect(() => {
    const pId = isPartner ? partnerId : formData.forPartnerId;
    const partner = partners.find(p => p.id === pId);
    if (!partner) {
      setFormData(prev => ({ ...prev, bookingFee: "0" }));
    }
  }, [formData.forPartnerId, partners, isPartner, partnerId]);

  // AUTO-CALC EDIT FORM TOTAL PRICE
  useEffect(() => {
    if (!editTarget) return;
    const sum = (editForm.activities || []).reduce((acc: number, act: any) => acc + (parseFloat(act.totalPrice as any) || 0), 0);
    const disc = parseFloat(editForm.discountAmount) || 0;
    let final = sum;
    if (disc > 0) {
      final = editForm.discountType === "%" ? sum * (1 - disc / 100) : sum - disc;
    }
    const fee = parseFloat(editForm.bookingFee) || 0;
    setEditForm(prev => ({ ...prev, totalPrice: Math.max(0, final - fee).toFixed(2) }));
  }, [editForm.activities, editForm.discountAmount, editForm.discountType, editForm.bookingFee, editTarget]);

  // AUTO-CALC EDIT FORM BOOKING FEE (ONLY RESET IF NO PARTNER)
  useEffect(() => {
    if (!editTarget) return;
    const pId = isPartner ? partnerId : (editForm.forPartnerId || editTarget.partnerId);
    const partner = partners.find(p => p.id === pId);
    if (!partner) {
      setEditForm(prev => ({ ...prev, bookingFee: "0" }));
    }
  }, [editForm.forPartnerId, editTarget, partners, isPartner, partnerId]);

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

  const fetchSlotsForActivity = async (index: number, serviceId: string, date: string, quantity: number, excludeBookingId?: string) => {
    if (!serviceId || !date) return;
    const svc = services.find(s => s.id === serviceId);
    if (!svc?.durationMinutes) return;

    setFormData(prev => {
      const acts = [...prev.activities];
      if (acts[index]) acts[index] = { ...acts[index], slotsLoading: true };
      return { ...prev, activities: acts };
    });

    try {
      const res = await fetch(`/api/slots?serviceId=${serviceId}&date=${date}&quantity=${quantity}${excludeBookingId ? `&excludeBookingId=${excludeBookingId}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => {
          const acts = [...prev.activities];
          if (acts[index]) {
            acts[index] = {
              ...acts[index],
              slotsLoading: false,
              slotsClosed: data.closed ?? false,
              slots: data.slots || []
            };
          }
          return { ...prev, activities: acts };
        });
      }
    } catch {
      setFormData(prev => {
        const acts = [...prev.activities];
        if (acts[index]) acts[index] = { ...acts[index], slotsLoading: false };
        return { ...prev, activities: acts };
      });
    }
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
    new Date(b.activityDate) < todayStart && b.status !== "CANCELLED" && b.showedUp === false;

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
    // Now handled by useEffect automatically, but keeping the button logic if manual override needed
    const pId = isPartner ? partnerId : formData.forPartnerId;
    const partner = partners.find(p => p.id === pId);
    if (!partner) return;
    const totalRaw = formData.activities.reduce((acc, act) => acc + (parseFloat(act.totalPrice as any) || 0), 0);
    const disc = parseFloat(formData.discountAmount) || 0;
    let net = totalRaw;
    if (disc > 0) {
      net = formData.discountType === "%" ? totalRaw * (1 - disc / 100) : totalRaw - disc;
    }
    setFormData({ ...formData, bookingFee: (net * (partner.commission / 100)).toFixed(2) });
  };

  const applyEditQuickCommission = () => {
    const pId = isPartner ? partnerId : (editForm.forPartnerId || editTarget?.partnerId);
    const partner = partners.find(p => p.id === pId);
    if (!partner) return;

    const totalRaw = (editForm.activities || []).reduce((acc: number, act: any) => acc + (parseFloat(act.totalPrice as any) || 0), 0);
    const disc = parseFloat(editForm.discountAmount) || 0;
    let net = totalRaw;
    if (disc > 0) {
      net = editForm.discountType === "%" ? totalRaw * (1 - disc / 100) : totalRaw - disc;
    }
    const calculatedFee = (net * (partner.commission / 100)).toFixed(2);
    setEditForm({
      ...editForm,
      bookingFee: calculatedFee
    });
  };

  const handleServiceSelectForActivity = (index: number, serviceId: string) => {
    const svc = services.find(s => s.id === serviceId);
    setFormData(prev => {
      const acts = [...prev.activities];
      const current = acts[index];
      if (!svc) {
        acts[index] = { ...current, serviceId: "", activityType: "", totalPrice: 0, activityTime: "", slots: [] };
      } else {
        const label = svc.variant ? `${svc.name} — ${svc.variant}` : svc.name;
        const unitPrice = svc.price ?? null;
        const isPaxPriced = svc.minPax != null;
        const initPax = svc.minPax ?? current.pax;
        const initQty = isPaxPriced ? 1 : current.quantity;
        const multiplier = isPaxPriced ? initPax : initQty;
        
        acts[index] = {
          ...current,
          serviceId: svc.id,
          activityType: label,
          activityTime: svc.durationMinutes ? "" : current.activityTime,
          pax: initPax,
          quantity: initQty,
          createUnitPrice: unitPrice,
          totalPrice: ((unitPrice || 0) * multiplier) as any, // initial price for this act
        };
        if (svc.durationMinutes && current.activityDate) {
          fetchSlotsForActivity(index, svc.id, current.activityDate, initQty);
        }
      }
      return { ...prev, activities: acts };
    });
  };

  const submitCreate = async (override = false, reason = "") => {
    if (submitting) return;
    if (formData.activities.some(a => services.find(s => s.id === a.serviceId)?.durationMinutes && !a.activityTime)) {
      setFormError("Por favor, selecione horários para todas as atividades.");
      return;
    }
    setSubmitting(true); setFormError(null);
    try {
      const payload: Record<string, any> = { ...formData };
      if (!payload.forPartnerId) delete payload.forPartnerId;
      if (override) {
        payload.override = true;
        payload.overrideReason = reason;
        payload.userName = user?.fullName || "Staff";
      }
      // Use fallback unit price to avoid null in payload if needed
      payload.activities = payload.activities.map((a: any) => ({
        ...a,
        createUnitPrice: a.createUnitPrice || 0
      }));
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false); setFormData(defaultForm); setOverrideModal(null); setOverrideReason("");
        fetchBookings();
      } else {
        const d = await res.json();
        if (d.error === "SLOT_FULL" && d.canOverride) {
          setOverrideType("create");
          setOverrideModal({ time: d.activity || "Slot", available: d.available, capacity: d.capacity });
        } else if (d.error === "SLOT_FULL") {
          setFormError(`O slot de ${d.activity} está sem disponibilidade (${d.available}/${d.capacity} livres)`);
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
    
    const activities = b.activities && b.activities.length > 0 
      ? b.activities.map(a => {
          const svc = a.serviceId ? services.find(s => s.id === a.serviceId) : null;
          return {
            id: a.id,
            serviceId: a.serviceId || "",
            activityDate: a.activityDate.split("T")[0],
            activityTime: a.activityTime || "",
            pax: a.pax,
            quantity: a.quantity || 1,
            activityType: a.activityType || "",
            totalPrice: a.totalPrice || 0,
            createUnitPrice: svc?.price ?? 0, 
            slots: [] as SlotInfo[],
            slotsLoading: false,
            slotsClosed: false
          };
        })
      : [{
          serviceId: b.serviceId || "",
          activityDate: dateStr,
          activityTime: b.activityTime || "",
          pax: b.pax,
          quantity: b.quantity || 1,
          activityType: b.activityType || "",
          totalPrice: b.totalPrice || 0,
          createUnitPrice: unitPrice || 0,
          slots: [] as SlotInfo[],
          slotsLoading: false,
          slotsClosed: false
        }];

    setEditForm({
      customerName: b.customerName,
      customerEmail: b.customerEmail || "",
      customerPhone: b.customerPhone || "",
      countryCode: b.country || "PT",
      totalPrice: b.totalPrice?.toString() || "0",
      notes: b.notes || "",
      forPartnerId: b.partnerId || "",
      bookingFee: b.bookingFee?.toString() || "0",
      discountAmount: "0",
      discountType: "%",
      activities
    });
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
        const data = await res.json();
        const updater = (prev: Booking[]) => prev.map(b =>
          b.id === booking.id
            ? { ...b, showedUp: data.showedUp, totalPrice: data.totalPrice ?? b.totalPrice }
            : b
        );
        setBookings(updater);
        setFiltered(updater);
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
        setFormData={setFormData}
        defaultForm={defaultForm}
        syncMsg={syncMsg}
        setSlots={() => {}}
        setCreateUnitPrice={() => {}}
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
        handleServiceSelectForActivity={handleServiceSelectForActivity}
        fetchSlotsForActivity={fetchSlotsForActivity}
        canOverride={canOverride}
        isPartner={isPartner}
        todayStr={todayStr}
        applyQuickCommission={applyQuickCommission}
        partners={partners}
        services={services}
        
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
        slots={slots}
        slotsLoading={slotsLoading}
        slotsClosed={slotsClosed}

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
