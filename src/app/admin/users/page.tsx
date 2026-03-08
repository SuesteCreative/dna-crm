"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Users, Shield, RefreshCcw, ChevronDown, Info, KeyRound, X } from "lucide-react";
import "./admin-users.css";

interface ProfileInfo {
    requestName: string | null;
    companyName: string | null;
    nif: string | null;
    phone: string | null;
    website: string | null;
}

interface CrmUser {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
    role: string;
    partnerId: string | null;
    createdAt: number;
    profileInfo: ProfileInfo | null;
}

interface Partner {
    id: string;
    name: string;
    email: string;
}

const ROLE_LABELS: Record<string, string> = {
    USER: "Sem acesso",
    PARTNER: "Parceiro",
    ADMIN: "Admin",
    SUPER_ADMIN: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
    USER: "role-user",
    PARTNER: "role-partner",
    ADMIN: "role-admin",
    SUPER_ADMIN: "role-superadmin",
};

const PARTNER_PALETTE: { bg: string; text: string }[] = [
    { bg: "rgba(59,130,246,.18)",  text: "#3b82f6" },
    { bg: "rgba(20,184,166,.18)",  text: "#14b8a6" },
    { bg: "rgba(168,85,247,.18)",  text: "#a855f7" },
    { bg: "rgba(245,158,11,.18)",  text: "#f59e0b" },
    { bg: "rgba(236,72,153,.18)",  text: "#ec4899" },
    { bg: "rgba(34,197,94,.18)",   text: "#22c55e" },
    { bg: "rgba(249,115,22,.18)",  text: "#f97316" },
    { bg: "rgba(99,102,241,.18)",  text: "#6366f1" },
];

export default function AdminUsersPage() {
    const { isLoaded, isSignedIn } = useUser();
    const { sessionClaims } = useAuth();
    const myRole = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isSuperAdmin = myRole === "SUPER_ADMIN";

    const [users, setUsers] = useState<CrmUser[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
    const [pendingPartners, setPendingPartners] = useState<Record<string, string>>({});
    const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
    const [resetTarget, setResetTarget] = useState<CrmUser | null>(null);
    const [resetPw, setResetPw] = useState("");
    const [resetSaving, setResetSaving] = useState(false);
    const [resetMsg, setResetMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        if (isSignedIn) {
            fetchUsers();
            fetchPartners();
        }
    }, [isSignedIn]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
                const roles: Record<string, string> = {};
                const pts: Record<string, string> = {};
                data.forEach((u: CrmUser) => {
                    roles[u.id] = u.role;
                    pts[u.id] = u.partnerId || "";
                });
                setPendingRoles(roles);
                setPendingPartners(pts);
            }
        } catch { }
        finally { setLoading(false); }
    };

    const fetchPartners = async () => {
        try {
            const res = await fetch("/api/partners");
            if (res.ok) setPartners(await res.json());
        } catch { }
    };

    const handleSave = async (userId: string) => {
        setSaving(userId);
        try {
            const res = await fetch("/api/admin/users/assign-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetUserId: userId,
                    role: pendingRoles[userId],
                    partnerId: pendingPartners[userId] || null,
                }),
            });
            if (res.ok) {
                await fetchUsers();
            } else {
                const d = await res.json();
                alert(d.error || "Erro ao guardar");
            }
        } catch { alert("Erro de rede"); }
        finally { setSaving(null); }
    };

    const handleResetPassword = async () => {
        if (!resetTarget || !resetPw) return;
        setResetSaving(true);
        setResetMsg(null);
        try {
            const res = await fetch("/api/admin/users/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: resetTarget.id, newPassword: resetPw }),
            });
            const d = await res.json();
            if (res.ok) {
                setResetMsg({ type: "success", text: "Palavra-passe alterada com sucesso." });
                setResetPw("");
                setTimeout(() => { setResetTarget(null); setResetMsg(null); }, 2000);
            } else {
                setResetMsg({ type: "error", text: d.error || "Erro ao alterar palavra-passe." });
            }
        } catch {
            setResetMsg({ type: "error", text: "Erro de ligação." });
        } finally {
            setResetSaving(false);
        }
    };

    if (!isLoaded || !isSignedIn) return null;

    return (
        <div className="au-root">
            <header className="au-header">
                <div>
                    <h1 className="au-title">Gestão de Utilizadores</h1>
                    <p className="au-sub">Atribua funções e permissões a cada utilizador.</p>
                </div>
                <button className="au-refresh" onClick={fetchUsers} disabled={loading}>
                    <RefreshCcw size={15} className={loading ? "spin" : ""} />
                </button>
            </header>

            {loading ? (
                <div className="au-loading"><div className="loader" /></div>
            ) : (
                <div className="au-table-wrap">
                    <table className="au-table">
                        <thead>
                            <tr>
                                <th>Utilizador</th>
                                <th>Função Atual</th>
                                <th>Atribuir Função</th>
                                <th>Ligar a parceiro existente (opcional)</th>
                                <th style={{ width: 100 }}></th>
                                <th style={{ width: 48 }}></th>
                                {isSuperAdmin && <th style={{ width: 48 }}></th>}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => {
                                const changed =
                                    pendingRoles[u.id] !== u.role ||
                                    (pendingPartners[u.id] || "") !== (u.partnerId || "");
                                const isExpanded = expandedInfo === u.id;
                                return (
                                    <>
                                    <tr key={u.id}>
                                        <td>
                                            <div className="au-user">
                                                <img src={u.imageUrl} alt="" className="au-avatar" />
                                                <div>
                                                    <div className="au-name">{u.name}</div>
                                                    <div className="au-email">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {u.role === "PARTNER" && u.partnerId ? (() => {
                                                const idx = partners.findIndex(p => p.id === u.partnerId);
                                                const color = PARTNER_PALETTE[(idx >= 0 ? idx : 0) % PARTNER_PALETTE.length];
                                                const label = partners.find(p => p.id === u.partnerId)?.name ?? "Parceiro";
                                                return (
                                                    <span className="role-badge" style={{ background: color.bg, color: color.text }}>
                                                        {label}
                                                    </span>
                                                );
                                            })() : (
                                                <span className={`role-badge ${ROLE_COLORS[u.role] || "role-user"}`}>
                                                    {ROLE_LABELS[u.role] || u.role}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="au-select-wrap">
                                                <select
                                                    className="au-select"
                                                    value={pendingRoles[u.id] || "USER"}
                                                    onChange={e => setPendingRoles(p => ({ ...p, [u.id]: e.target.value }))}
                                                >
                                                    <option value="USER">Sem acesso</option>
                                                    <option value="PARTNER">Parceiro</option>
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="SUPER_ADMIN">Super Admin</option>
                                                </select>
                                                <ChevronDown size={14} className="au-select-ico" />
                                            </div>
                                        </td>
                                        <td>
                                            {(pendingRoles[u.id] === "PARTNER") && (
                                                <div className="au-select-wrap">
                                                    <select
                                                        className="au-select"
                                                        value={pendingPartners[u.id] || ""}
                                                        onChange={e => setPendingPartners(p => ({ ...p, [u.id]: e.target.value }))}
                                                    >
                                                        <option value="">— Selecionar —</option>
                                                        {partners.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown size={14} className="au-select-ico" />
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {changed && (
                                                <button
                                                    className="au-save-btn"
                                                    onClick={() => handleSave(u.id)}
                                                    disabled={saving === u.id}
                                                >
                                                    {saving === u.id ? "..." : "Guardar"}
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            {u.profileInfo && (
                                                <button
                                                    className={`au-info-btn ${isExpanded ? "active" : ""}`}
                                                    onClick={() => setExpandedInfo(isExpanded ? null : u.id)}
                                                    title="Ver informação submetida"
                                                >
                                                    <Info size={15} />
                                                </button>
                                            )}
                                        </td>
                                        {isSuperAdmin && (
                                            <td>
                                                <button
                                                    className="au-pw-btn"
                                                    onClick={() => { setResetTarget(u); setResetPw(""); setResetMsg(null); }}
                                                    title="Redefinir palavra-passe"
                                                >
                                                    <KeyRound size={15} />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                    {isExpanded && u.profileInfo && (
                                        <tr className="au-info-row" key={`${u.id}-info`}>
                                            <td colSpan={isSuperAdmin ? 7 : 6}>
                                                <div className="au-info-panel">
                                                    {[
                                                        { label: "Nome", value: u.profileInfo.requestName },
                                                        { label: "Empresa", value: u.profileInfo.companyName },
                                                        { label: "NIF", value: u.profileInfo.nif },
                                                        { label: "Telemóvel", value: u.profileInfo.phone },
                                                        { label: "Website", value: u.profileInfo.website },
                                                    ].filter(f => f.value).map(({ label, value }) => (
                                                        <div key={label} className="au-info-field">
                                                            <span className="au-info-label">{label}</span>
                                                            <span className="au-info-value">{value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {resetTarget && (
                <div className="modal-backdrop" onClick={() => setResetTarget(null)}>
                    <div className="au-pw-modal" onClick={e => e.stopPropagation()}>
                        <div className="au-pw-modal-hdr">
                            <div>
                                <div className="au-pw-modal-title">Redefinir Palavra-passe</div>
                                <div className="au-pw-modal-sub">{resetTarget.name} · {resetTarget.email}</div>
                            </div>
                            <button className="modal-close" onClick={() => setResetTarget(null)}><X size={18} /></button>
                        </div>
                        <div className="au-pw-modal-body">
                            <label className="au-pw-label">Nova palavra-passe</label>
                            <input
                                type="password"
                                className="au-pw-input"
                                value={resetPw}
                                onChange={e => setResetPw(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                autoFocus
                            />
                            {resetMsg && (
                                <div className={`au-pw-msg ${resetMsg.type}`}>{resetMsg.text}</div>
                            )}
                        </div>
                        <div className="au-pw-modal-footer">
                            <button className="btn-ghost" onClick={() => setResetTarget(null)}>Cancelar</button>
                            <button
                                className="au-save-btn"
                                disabled={resetSaving || resetPw.length < 8}
                                onClick={handleResetPassword}
                            >
                                {resetSaving ? "A alterar..." : "Redefinir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
