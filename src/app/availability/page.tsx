"use client";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, Users, CheckCircle, Plus, ChevronRight } from "lucide-react";
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

    const [date, setDate] = useState(todayLisbon());
    const [data, setData] = useState<AvailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<{ service: ServiceAvail; slot: SlotInfo } | null>(null);
    const [bookingForm, setBookingForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", pax: 1 });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!role) { router.push("/sign-in"); return; }
    }, [isLoaded, role]);

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

    const handleBook = async () => {
        if (!selected) return;
        setSubmitting(true);
        setError(null);
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
                    totalPrice: selected.service.price ? selected.service.price * bookingForm.pax : 0,
                    quantity: 1,
                    userName: user?.fullName ?? "Partner",
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

    const grouped = data?.services.reduce<Record<string, ServiceAvail[]>>((acc, svc) => {
        const cat = svc.category ?? "Outros";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(svc);
        return acc;
    }, {}) ?? {};

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
                                                        onClick={() => { setSelected({ service: svc, slot }); setSuccess(null); setError(null); setBookingForm({ customerName: "", customerPhone: "", customerEmail: "", pax: svc.minPax ?? 1 }); }}
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
                        <div className="avail-panel">
                            <div className="avail-panel-hdr">
                                <h2>Nova Reserva</h2>
                                <button className="avail-panel-close" onClick={() => setSelected(null)}>✕</button>
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
                                <div className="avail-field">
                                    <label>Nº de pessoas</label>
                                    <input type="number" min={selected.service.minPax ?? 1} max={Math.min(selected.service.maxPax ?? selected.slot.available, selected.slot.available)} value={bookingForm.pax} onChange={(e) => setBookingForm((f) => ({ ...f, pax: parseInt(e.target.value) || 1 }))} />
                                </div>
                                {selected.service.price && (
                                    <div className="avail-total">
                                        Total: <strong>{(selected.service.price * bookingForm.pax).toFixed(2)}€</strong>
                                    </div>
                                )}
                                <button className="avail-btn-primary" onClick={handleBook} disabled={submitting || !bookingForm.customerName}>
                                    <Plus size={14} /> {submitting ? "A criar..." : "Criar Reserva"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
