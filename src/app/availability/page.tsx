"use client";
import { useEffect, useState, useMemo } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Users, CheckCircle, Plus, ChevronRight, X } from "lucide-react";
import "./availability.css";

interface SlotInfo { time: string; available: number; capacity: number; blocked: boolean; }
interface ServiceAvail {
    id: string; name: string; variant: string | null; category: string | null;
    price: number | null; durationMinutes: number; minPax: number | null; maxPax: number | null;
    slots: SlotInfo[];
}
interface AvailResponse { closed: boolean; openTime?: string; closeTime?: string; services: ServiceAvail[]; }

function todayLisbon() {
    return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Lisbon" });
}

export default function AvailabilityPage() {
    const { sessionClaims, isLoaded } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const partnerId = (sessionClaims as any)?.metadata?.partnerId as string | undefined;

    const [date, setDate] = useState(todayLisbon());
    const [data, setData] = useState<AvailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<{ service: ServiceAvail; slot: SlotInfo } | null>(null);

    // Booking Form State
    const [bookingForm, setBookingForm] = useState({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        pax: 1,
        quantity: 1
    });

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial Security Check
    useEffect(() => {
        if (!isLoaded) return;
        // Allow access if they have a role or if they are a partner
        if (!role && !partnerId) {
            router.push("/sign-in");
            return;
        }
    }, [isLoaded, role, partnerId]);

    // Fetch Availability
    useEffect(() => {
        setData(null);
        setSelected(null);
        setSuccess(null);
        setLoading(true);
        fetch(`/api/availability?date=${date}`)
            .then((r) => r.json())
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [date]);

    // Service Type Logic (Matching main dashboard)
    const isJetski = selected?.service.name.toLowerCase().includes("jetski");
    const isSofa = selected?.service.name.toLowerCase().includes("sofa");
    const isBanana = selected?.service.name.toLowerCase().includes("banana");

    // Quantity range
    const qtyRange = useMemo(() => {
        if (isJetski) return [1, 2, 3];
        return [1];
    }, [isJetski]);

    // Pax range
    const paxRange = useMemo(() => {
        if (isJetski) {
            const start = bookingForm.quantity;
            const end = bookingForm.quantity * 2;
            const range = [];
            for (let i = start; i <= end; i++) range.push(i);
            return range;
        }
        if (isSofa) return [2, 3, 4, 5, 6];
        if (isBanana) return [2, 3, 4, 5, 6, 7, 8];
        return null; // For others, use numeric input
    }, [isJetski, isSofa, isBanana, bookingForm.quantity]);

    // Reset Pax/Qty when selecting a new slot
    useEffect(() => {
        if (selected) {
            const defaultPax = isSofa || isBanana ? 2 : (selected.service.minPax ?? 1);
            setBookingForm(f => ({ ...f, pax: defaultPax, quantity: 1 }));
        }
    }, [selected, isSofa, isBanana]);

    // Keep pax in range [quantity, quantity * 2] for jetskis
    useEffect(() => {
        if (isJetski) {
            setBookingForm(f => {
                const min = f.quantity;
                const max = f.quantity * 2;
                if (f.pax < min || f.pax > max) {
                    return { ...f, pax: min };
                }
                return f;
            });
        }
    }, [bookingForm.quantity, isJetski]);

    const handleBook = async () => {
        if (!selected) return;
        setSubmitting(true);
        setError(null);

        // Price logic: Jetskis are per quantity (mota), others are per pax
        const qty = isJetski ? bookingForm.quantity : bookingForm.pax;
        const finalPrice = selected.service.price ? selected.service.price * qty : 0;

        try {
            const res = await fetch("/api/bookings/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: bookingForm.customerName,
                    customerPhone: bookingForm.customerPhone,
                    customerEmail: bookingForm.customerEmail,
                    activityDate: date,
                    activityTime: selected.slot.time,
                    pax: bookingForm.pax,
                    serviceId: selected.service.id,
                    activityType: selected.service.name + (selected.service.variant ? ` — ${selected.service.variant}` : ""),
                    totalPrice: finalPrice,
                    quantity: bookingForm.quantity,
                    partnerId: partnerId || undefined,
                    userName: user?.fullName ?? "Partner User",
                }),
            });
            if (!res.ok) {
                const d = await res.json();
                setError(d.error ?? "Erro ao criar reserva.");
            } else {
                setSuccess(`Reserva criada: ${selected.service.name} às ${selected.slot.time}`);
                setSelected(null);
                // Refresh availability
                const r2 = await fetch(`/api/availability?date=${date}`);
                setData(await r2.json());
            }
        } finally {
            setSubmitting(false);
        }
    };

    const variantWeights: Record<string, number> = {
        "1 hour": 100,
        "30 minutes": 80,
        "20 minutes": 60,
        "15 minutes": 40,
        "10 minutes": 20
    };

    const grouped = data?.services.reduce<Record<string, ServiceAvail[]>>((acc, svc) => {
        const cat = svc.category ?? "Outros";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(svc);
        // Sort variants within category
        acc[cat].sort((a, b) => {
            const wa = variantWeights[a.variant ?? ""] ?? 0;
            const wb = variantWeights[b.variant ?? ""] ?? 0;
            if (wa || wb) return wb - wa;
            return a.name.localeCompare(b.name);
        });
        return acc;
    }, {}) ?? {};

    const totalPriceDisplay = selected?.service.price
        ? (selected.service.price * (isJetski ? bookingForm.quantity : bookingForm.pax)).toFixed(2)
        : "0.00";

    return (
        <div className="avail-page">
            <div className="avail-header">
                <div>
                    <h1 className="avail-title"><CalendarDays size={22} /> Disponibilidade</h1>
                    <p className="avail-sub">Consulte horários disponíveis e crie reservas.</p>
                </div>
                <button className="avail-btn-sec" onClick={() => router.push("/")}>
                    <ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Dashboard
                </button>
            </div>

            <div className="avail-date-row">
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="avail-date-input" />
                {data && !data.closed && (
                    <span className="avail-hours"><Clock size={13} /> {data.openTime} – {data.closeTime}</span>
                )}
            </div>

            {success && (
                <div className="avail-success"><CheckCircle size={15} /> {success}</div>
            )}

            {loading && <div className="avail-loading">A carregar...</div>}

            {!loading && data?.closed && (
                <div className="avail-closed">Encerrado neste dia. Sem atividades disponíveis.</div>
            )}

            {!loading && data && !data.closed && (
                <div className="avail-content">
                    <div className="avail-services">
                        {Object.entries(grouped).map(([cat, svcs]) => (
                            <div key={cat} className="avail-category">
                                <h3 className="avail-cat-label">{cat}</h3>
                                {svcs.map((svc) => {
                                    const hasAny = svc.slots.some((s) => !s.blocked);
                                    return (
                                        <div key={svc.id} className={`avail-service-card${!hasAny ? " avail-full" : ""}`}>
                                            <div className="avail-svc-hdr">
                                                <span className="avail-svc-name">{svc.name}{svc.variant ? <em> — {svc.variant}</em> : null}</span>
                                                <span className="avail-svc-meta">
                                                    <Clock size={11} /> {svc.durationMinutes} min
                                                    {svc.price ? <> · {svc.price.toFixed(2)}€/pax</> : null}
                                                </span>
                                            </div>
                                            <div className="avail-slots">
                                                {svc.slots.map((slot) => (
                                                    <button
                                                        key={slot.time}
                                                        className={`avail-slot${slot.blocked ? " blocked" : ""}${selected?.service.id === svc.id && selected?.slot.time === slot.time ? " active" : ""}`}
                                                        disabled={slot.blocked}
                                                        onClick={() => {
                                                            setSelected({ service: svc, slot });
                                                            setSuccess(null);
                                                            setError(null);
                                                            setBookingForm({
                                                                customerName: "",
                                                                customerPhone: "",
                                                                customerEmail: "",
                                                                pax: svc.minPax ?? 1,
                                                                quantity: 1
                                                            });
                                                        }}
                                                    >
                                                        <span className="avail-slot-time">{slot.time}</span>
                                                        <span className="avail-slot-cap">
                                                            <Users size={9} /> {slot.available}/{slot.capacity}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Booking panel */}
                    {selected && (
                        <div className="avail-panel-backdrop" onClick={() => setSelected(null)}>
                            <div className="avail-panel" onClick={(e) => e.stopPropagation()}>
                                <div className="avail-panel-hdr">
                                    <h2>Nova Reserva</h2>
                                    <button className="avail-panel-close" onClick={() => setSelected(null)}><X size={20} /></button>
                                </div>
                                <div className="avail-panel-info">
                                    <strong>{selected.service.name}</strong>{selected.service.variant ? ` — ${selected.service.variant}` : ""}
                                    <span> · {selected.slot.time} · {selected.service.durationMinutes} min</span>
                                </div>
                                {error && <div className="avail-error">{error}</div>}
                                <div className="avail-form">
                                    <div className="avail-field">
                                        <label>Nome do cliente *</label>
                                        <input value={bookingForm.customerName} onChange={(e) => setBookingForm((f) => ({ ...f, customerName: e.target.value }))} placeholder="Nome completo" />
                                    </div>
                                    <div className="avail-field">
                                        <label>Telefone</label>
                                        <input value={bookingForm.customerPhone} onChange={(e) => setBookingForm((f) => ({ ...f, customerPhone: e.target.value }))} placeholder="+351 9xx xxx xxx" />
                                    </div>
                                    <div className="avail-field">
                                        <label>Email</label>
                                        <input type="email" value={bookingForm.customerEmail} onChange={(e) => setBookingForm((f) => ({ ...f, customerEmail: e.target.value }))} placeholder="email@exemplo.com" />
                                    </div>

                                    <div className="avail-row-fields">
                                        {/* Quantity Dropdown for Jetskis */}
                                        {isJetski && (
                                            <div className="avail-field">
                                                <label>Qtd. Jetskis</label>
                                                <select value={bookingForm.quantity} onChange={(e) => setBookingForm(f => ({ ...f, quantity: parseInt(e.target.value) }))}>
                                                    {qtyRange.map(q => <option key={q} value={q}>{q}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        <div className="avail-field">
                                            <label>Nº de pessoas</label>
                                            {paxRange ? (
                                                <select value={bookingForm.pax} onChange={(e) => setBookingForm(f => ({ ...f, pax: parseInt(e.target.value) }))}>
                                                    {paxRange.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                            ) : (
                                                <input type="number" min={selected.service.minPax ?? 1} max={Math.min(selected.service.maxPax ?? selected.slot.available, selected.slot.available)} value={bookingForm.pax} onChange={(e) => setBookingForm((f) => ({ ...f, pax: parseInt(e.target.value) || 1 }))} />
                                            )}
                                        </div>
                                    </div>

                                    {selected.service.price && (
                                        <div className="avail-total">
                                            Total: <strong>{totalPriceDisplay}€</strong>
                                        </div>
                                    )}
                                    <button className="avail-btn-primary" onClick={handleBook} disabled={submitting || !bookingForm.customerName}>
                                        <Plus size={14} /> {submitting ? "A criar..." : "Criar Reserva"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
