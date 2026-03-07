"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Clock, Save, AlertCircle, CheckCircle } from "lucide-react";
import "./schedule.css";

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface ScheduleRow {
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isOpen: boolean;
}

interface ServiceRow {
    id: string;
    name: string;
    variant: string | null;
    category: string | null;
    durationMinutes: number | null;
    unitCapacity: number;
    capacityGroup: string | null;
    slotGapMinutes: number;
    isActive: boolean;
}

export default function SchedulePage() {
    const { isLoaded, userId, sessionClaims } = useAuth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

    const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [saving, setSaving] = useState<number | null>(null);
    const [svcSaving, setSvcSaving] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [toastOk, setToastOk] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchSchedule();
            fetchServices();
        }
    }, [userId]);

    const fetchSchedule = async () => {
        const res = await fetch("/api/schedule");
        if (res.ok) setSchedule(await res.json());
    };

    const fetchServices = async () => {
        const res = await fetch("/api/services");
        if (res.ok) {
            const data = await res.json();
            setServices(data);
        }
    };

    const showToast = (msg: string, ok = true) => {
        setToast(msg); setToastOk(ok);
        setTimeout(() => setToast(null), 3000);
    };

    const saveDay = async (row: ScheduleRow) => {
        setSaving(row.dayOfWeek);
        const res = await fetch("/api/schedule", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dayOfWeek: row.dayOfWeek, openTime: row.openTime, closeTime: row.closeTime, isOpen: row.isOpen }),
        });
        setSaving(null);
        if (res.ok) showToast(`${DAY_NAMES[row.dayOfWeek]} guardado`);
        else showToast("Erro ao guardar", false);
    };

    const updateDay = (dayOfWeek: number, patch: Partial<ScheduleRow>) => {
        setSchedule(prev => prev.map(r => r.dayOfWeek === dayOfWeek ? { ...r, ...patch } : r));
    };

    const saveService = async (svc: ServiceRow) => {
        setSvcSaving(svc.id);
        const res = await fetch(`/api/services/${svc.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                durationMinutes: svc.durationMinutes,
                unitCapacity: svc.unitCapacity,
                capacityGroup: svc.capacityGroup || null,
                slotGapMinutes: svc.slotGapMinutes,
            }),
        });
        setSvcSaving(null);
        if (res.ok) showToast("Serviço guardado");
        else showToast("Erro ao guardar serviço", false);
    };

    const updateSvc = (id: string, patch: Partial<ServiceRow>) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    };

    if (!isLoaded) return <div className="sched-loading"><div className="loader" /></div>;
    if (!userId) return <RedirectToSignIn />;
    if (!isAdmin) return <div className="sched-forbidden">Acesso restrito a administradores.</div>;

    return (
        <main className="sched-main">
            <header className="sched-header">
                <div>
                    <h1 className="sched-title">Horário & Serviços</h1>
                    <p className="sched-sub">Configure os horários de funcionamento e a capacidade dos serviços.</p>
                </div>
            </header>

            {toast && (
                <div className={`sched-toast ${toastOk ? "ok" : "err"}`}>
                    {toastOk ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {toast}
                </div>
            )}

            <section className="sched-section">
                <h2 className="sched-section-title"><Clock size={18} /> Horário de Funcionamento</h2>
                <div className="sched-grid">
                    {schedule.map(row => (
                        <div key={row.dayOfWeek} className={`sched-day-card ${!row.isOpen ? "closed" : ""}`}>
                            <div className="sched-day-top">
                                <span className="sched-day-name">{DAY_NAMES[row.dayOfWeek]}</span>
                                <label className="sched-toggle">
                                    <input
                                        type="checkbox"
                                        checked={row.isOpen}
                                        onChange={e => updateDay(row.dayOfWeek, { isOpen: e.target.checked })}
                                    />
                                    <span className="toggle-track" />
                                    <span className="toggle-label">{row.isOpen ? "Aberto" : "Encerrado"}</span>
                                </label>
                            </div>
                            {row.isOpen && (
                                <div className="sched-times">
                                    <div className="sched-time-field">
                                        <label>Abertura</label>
                                        <input type="time" value={row.openTime} onChange={e => updateDay(row.dayOfWeek, { openTime: e.target.value })} />
                                    </div>
                                    <div className="sched-time-field">
                                        <label>Fecho</label>
                                        <input type="time" value={row.closeTime} onChange={e => updateDay(row.dayOfWeek, { closeTime: e.target.value })} />
                                    </div>
                                </div>
                            )}
                            <button
                                className="sched-save-btn"
                                onClick={() => saveDay(row)}
                                disabled={saving === row.dayOfWeek}
                            >
                                <Save size={13} /> {saving === row.dayOfWeek ? "A guardar..." : "Guardar"}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="sched-section">
                <h2 className="sched-section-title">Configuração de Serviços</h2>
                <p className="sched-section-sub">Defina a duração, capacidade e grupo de capacidade partilhada para cada serviço.</p>
                <div className="svc-table-wrap">
                    <table className="svc-table">
                        <thead>
                            <tr>
                                <th>Serviço</th>
                                <th>Duração (min)</th>
                                <th>Capacidade</th>
                                <th>Grupo Capacidade</th>
                                <th>Gap entre slots (min)</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map(svc => (
                                <tr key={svc.id}>
                                    <td>
                                        <div className="svc-name">{svc.name}</div>
                                        {svc.variant && <div className="svc-variant">{svc.variant}</div>}
                                    </td>
                                    <td>
                                        <input
                                            type="number" min="5" step="5"
                                            value={svc.durationMinutes ?? ""}
                                            placeholder="—"
                                            className="svc-input"
                                            onChange={e => updateSvc(svc.id, { durationMinutes: parseInt(e.target.value) || null })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number" min="1"
                                            value={svc.unitCapacity}
                                            className="svc-input"
                                            onChange={e => updateSvc(svc.id, { unitCapacity: parseInt(e.target.value) || 1 })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={svc.capacityGroup ?? ""}
                                            placeholder="ex: JETSKI"
                                            className="svc-input wide"
                                            onChange={e => updateSvc(svc.id, { capacityGroup: e.target.value || null })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number" min="0"
                                            value={svc.slotGapMinutes}
                                            className="svc-input"
                                            onChange={e => updateSvc(svc.id, { slotGapMinutes: parseInt(e.target.value) || 10 })}
                                        />
                                    </td>
                                    <td>
                                        <button
                                            className="svc-save-btn"
                                            onClick={() => saveService(svc)}
                                            disabled={svcSaving === svc.id}
                                        >
                                            <Save size={13} /> {svcSaving === svc.id ? "..." : "Guardar"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
