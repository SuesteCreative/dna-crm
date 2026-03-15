"use client";

import { useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Clock, Save, AlertCircle, CheckCircle, Calendar, Trash2, Plus } from "lucide-react";
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
    serviceCloseTime: string | null;
    gcalEnabled: boolean;
    isActive: boolean;
    minPax: number | null;
    maxPax: number | null;
}

interface GcalStaffRow {
    id: string;
    name: string;
    calendarId: string;
    serviceId: string | null;
    order: number;
}

export default function SchedulePage() {
    const { isLoaded, userId, sessionClaims } = useAuth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

    const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
    const [services, setServices] = useState<ServiceRow[]>([]);
    const [gcalStaff, setGcalStaff] = useState<GcalStaffRow[]>([]);
    const [saving, setSaving] = useState<number | null>(null);
    const [svcSaving, setSvcSaving] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);
    const [toastOk, setToastOk] = useState(true);

    // New staff form state
    const [newStaffName, setNewStaffName] = useState("");
    const [newStaffCalendarId, setNewStaffCalendarId] = useState("");
    const [newStaffCapacityGroup, setNewStaffCapacityGroup] = useState("");
    const [newStaffOrder, setNewStaffOrder] = useState(0);
    const [staffSaving, setStaffSaving] = useState(false);

    useEffect(() => {
        if (userId) {
            fetchSchedule();
            fetchServices();
            fetchGcalStaff();
        }
    }, [userId]);

    const fetchSchedule = async () => {
        const res = await fetch("/api/schedule");
        if (res.ok) setSchedule(await res.json());
    };

    const fetchServices = async () => {
        const res = await fetch("/api/services");
        if (res.ok) setServices(await res.json());
    };

    const fetchGcalStaff = async () => {
        const res = await fetch("/api/gcal-staff");
        if (res.ok) setGcalStaff(await res.json());
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
                serviceCloseTime: svc.serviceCloseTime || null,
                gcalEnabled: svc.gcalEnabled,
                minPax: svc.minPax || null,
                maxPax: svc.maxPax || null,
            }),
        });
        setSvcSaving(null);
        if (res.ok) showToast("Serviço guardado");
        else showToast("Erro ao guardar serviço", false);
    };

    const updateSvc = (id: string, patch: Partial<ServiceRow>) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    };

    const addStaff = async () => {
        if (!newStaffName.trim() || !newStaffCalendarId.trim()) {
            showToast("Nome e Calendar ID são obrigatórios", false);
            return;
        }
        setStaffSaving(true);
        const res = await fetch("/api/gcal-staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newStaffName.trim(),
                calendarId: newStaffCalendarId.trim(),
                capacityGroup: newStaffCapacityGroup.trim() || null,
                order: newStaffOrder,
            }),
        });
        setStaffSaving(false);
        if (res.ok) {
            setNewStaffName("");
            setNewStaffCalendarId("");
            setNewStaffCapacityGroup("");
            setNewStaffOrder(0);
            await fetchGcalStaff();
            showToast("Staff de calendário adicionado");
        } else {
            showToast("Erro ao adicionar", false);
        }
    };

    const deleteStaff = async (id: string) => {
        const res = await fetch(`/api/gcal-staff?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            setGcalStaff(prev => prev.filter(s => s.id !== id));
            showToast("Removido");
        } else {
            showToast("Erro ao remover", false);
        }
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
                <p className="sched-section-sub">Duração, capacidade, horário de fecho e integração Google Calendar por serviço.</p>
                <div className="svc-table-wrap">
                    <table className="svc-table">
                        <thead>
                            <tr>
                                <th>Serviço</th>
                                <th>Duração (min)</th>
                                <th>Capacidade</th>
                                <th>Grupo Capacidade</th>
                                <th>Gap slots (min)</th>
                                <th>Fecho serviço</th>
                                <th>Pax mín</th>
                                <th>Pax máx</th>
                                <th>GCal</th>
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
                                        <input
                                            type="time"
                                            value={svc.serviceCloseTime ?? ""}
                                            className="svc-input wide"
                                            onChange={e => updateSvc(svc.id, { serviceCloseTime: e.target.value || null })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number" min="1"
                                            value={svc.minPax ?? ""}
                                            placeholder="—"
                                            className="svc-input"
                                            onChange={e => updateSvc(svc.id, { minPax: parseInt(e.target.value) || null })}
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="number" min="1"
                                            value={svc.maxPax ?? ""}
                                            placeholder="—"
                                            className="svc-input"
                                            onChange={e => updateSvc(svc.id, { maxPax: parseInt(e.target.value) || null })}
                                        />
                                    </td>
                                    <td>
                                        <label className="sched-toggle">
                                            <input
                                                type="checkbox"
                                                checked={svc.gcalEnabled}
                                                onChange={e => updateSvc(svc.id, { gcalEnabled: e.target.checked })}
                                            />
                                            <span className="toggle-track" />
                                        </label>
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

            <section className="sched-section">
                <h2 className="sched-section-title"><Calendar size={18} /> Staff de Calendário (Google Calendar)</h2>
                <p className="sched-section-sub">Cada staff representa um recurso físico (ex: Jetski 1). O CRM cria eventos "ocupado" no calendário do staff quando uma reserva é criada.</p>

                <div className="svc-table-wrap" style={{ marginBottom: 20 }}>
                    <table className="svc-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Calendar ID</th>
                                <th>Grupo Capacidade</th>
                                <th>Ordem</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {gcalStaff.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: "center", color: "var(--muted)", padding: "20px" }}>
                                        Nenhum staff configurado ainda.
                                    </td>
                                </tr>
                            )}
                            {gcalStaff.map(staff => {
                                return (
                                    <tr key={staff.id}>
                                        <td><div className="svc-name">{staff.name}</div></td>
                                        <td><div className="gcal-id">{staff.calendarId}</div></td>
                                        <td>
                                            {(staff as any).capacityGroup
                                                ? <span>{(staff as any).capacityGroup}</span>
                                                : <span style={{ color: "var(--muted)" }}>—</span>}
                                        </td>
                                        <td>{staff.order}</td>
                                        <td>
                                            <button className="gcal-delete-btn" onClick={() => deleteStaff(staff.id)}>
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="gcal-add-form">
                    <h3 className="gcal-add-title"><Plus size={14} /> Adicionar Staff</h3>
                    <div className="gcal-add-row">
                        <div className="gcal-field">
                            <label>Nome</label>
                            <input
                                type="text"
                                placeholder="ex: Jetski 1"
                                value={newStaffName}
                                onChange={e => setNewStaffName(e.target.value)}
                                className="svc-input wide"
                            />
                        </div>
                        <div className="gcal-field gcal-field-wide">
                            <label>Calendar ID</label>
                            <input
                                type="text"
                                placeholder="ex: abc123@group.calendar.google.com"
                                value={newStaffCalendarId}
                                onChange={e => setNewStaffCalendarId(e.target.value)}
                                className="svc-input"
                                style={{ width: 320 }}
                            />
                        </div>
                        <div className="gcal-field">
                            <label>Grupo Capacidade</label>
                            <input
                                type="text"
                                placeholder="ex: JETSKI_RENTAL"
                                value={newStaffCapacityGroup}
                                onChange={e => setNewStaffCapacityGroup(e.target.value)}
                                className="svc-input wide"
                            />
                        </div>
                        <div className="gcal-field">
                            <label>Ordem</label>
                            <input
                                type="number" min="0"
                                value={newStaffOrder}
                                onChange={e => setNewStaffOrder(parseInt(e.target.value) || 0)}
                                className="svc-input"
                            />
                        </div>
                        <button
                            className="svc-save-btn"
                            onClick={addStaff}
                            disabled={staffSaving}
                            style={{ alignSelf: "flex-end" }}
                        >
                            <Plus size={13} /> {staffSaving ? "..." : "Adicionar"}
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
