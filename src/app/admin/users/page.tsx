"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { Users, Shield, RefreshCcw, ChevronDown, Info, KeyRound, X, KeySquare } from "lucide-react";
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
    STAFF: "Staff de Praia",
    SUPER_ADMIN: "Super Admin",
};

const ROLE_COLORS: Record<string, string> = {
    USER: "role-user",
    PARTNER: "role-partner",
    STAFF: "role-staff",
    ADMIN: "role-admin",
    SUPER_ADMIN: "role-superadmin",
};

const PARTNER_PALETTE: { bg: string; text: string }[] = [
    { bg: "rgba(59,130,246,.18)", text: "#3b82f6" },
    { bg: "rgba(20,184,166,.18)", text: "#14b8a6" },
    { bg: "rgba(168,85,247,.18)", text: "#a855f7" },
    { bg: "rgba(245,158,11,.18)", text: "#f59e0b" },
    { bg: "rgba(236,72,153,.18)", text: "#ec4899" },
    { bg: "rgba(34,197,94,.18)", text: "#22c55e" },
    { bg: "rgba(249,115,22,.18)", text: "#f97316" },
    { bg: "rgba(99,102,241,.18)", text: "#6366f1" },
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

    const [activeTab, setActiveTab] = useState<"users" | "roles">("users");
    const [rolePerms, setRolePerms] = useState<any[]>([]);
    const [savingRole, setSavingRole] = useState<string | null>(null);

    // Body scroll lock
    useEffect(() => {
        document.body.classList.toggle("modal-open", !!resetTarget);
        return () => document.body.classList.remove("modal-open");
    }, [resetTarget]);

    useEffect(() => {
        if (isSignedIn) {
            fetchUsers();
            fetchPartners();
            if (isSuperAdmin) fetchRoles();
        }
    }, [isSignedIn, isSuperAdmin]);

    const fetchRoles = async () => {
        try {
            const res = await fetch("/api/admin/role-permissions");
            if (res.ok) setRolePerms(await res.json());
        } catch { }
    };

    const handleSaveRole = async (r: any) => {
        setSavingRole(r.role);
        try {
            const res = await fetch("/api/admin/role-permissions", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(r),
            });
            if (res.ok) await fetchRoles();
            else alert("Erro ao guardar permissões");
        } catch { alert("Erro de rede"); }
        finally { setSavingRole(null); }
    };

    const togglePerm = (rIndex: number, field: string) => {
        const next = [...rolePerms];
        next[rIndex] = { ...next[rIndex], [field]: !next[rIndex][field] };
        setRolePerms(next);
    };

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
            <header className="au-header" style={{ borderBottom: "none", paddingBottom: 0 }}>
                <div>
                    <h1 className="au-title">Gestão de Utilizadores</h1>
                    <p className="au-sub">Atribua funções e configure permissões de acesso.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button className="au-refresh" onClick={() => { fetchUsers(); if (isSuperAdmin) fetchRoles(); }} disabled={loading}>
                        <RefreshCcw size={15} className={loading ? "spin" : ""} />
                    </button>
                </div>
            </header>

            {isSuperAdmin && (
                <div className="au-tabs" style={{ padding: "0 24px", display: "flex", gap: 20, borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
                    <button
                        className={`au-tab-btn ${activeTab === "users" ? "active" : ""}`}
                        onClick={() => setActiveTab("users")}
                        style={{ padding: "12px 0", background: "none", border: "none", borderBottom: activeTab === "users" ? "2px solid var(--fg)" : "2px solid transparent", color: activeTab === "users" ? "var(--fg)" : "var(--muted)", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <Users size={16} /> Lista de Utilizadores
                    </button>
                    <button
                        className={`au-tab-btn ${activeTab === "roles" ? "active" : ""}`}
                        onClick={() => setActiveTab("roles")}
                        style={{ padding: "12px 0", background: "none", border: "none", borderBottom: activeTab === "roles" ? "2px solid var(--fg)" : "2px solid transparent", color: activeTab === "roles" ? "var(--fg)" : "var(--muted)", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <Shield size={16} /> Permissões de Cargos
                    </button>
                </div>
            )}

            {activeTab === "users" ? (
                loading ? (
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
                                                            <option value="STAFF">Staff de Praia</option>
                                                            <option value="ADMIN">Admin</option>
                                                            {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
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
                )
            ) : (
                <div className="au-roles-wrap" style={{ padding: "0 24px 40px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {rolePerms.map((r, i) => (
                            <div key={r.role} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: 16 }}>{ROLE_LABELS[r.role] || r.role}</h3>
                                        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Configuração de acessos e permissões para este cargo.</p>
                                    </div>
                                    <button
                                        className="au-save-btn"
                                        onClick={() => handleSaveRole(r)}
                                        disabled={savingRole === r.role}
                                    >
                                        {savingRole === r.role ? "..." : "Guardar Alterações"}
                                    </button>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>

                                    <div>
                                        <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", margin: "0 0 12px 0" }}>Dashboard e Reservas</h4>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 14 }}>
                                            <input type="checkbox" checked={r.dashboardAccess} onChange={() => togglePerm(i, "dashboardAccess")} />
                                            Acesso à Dashboard
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 14 }}>
                                            <input type="checkbox" checked={r.dashboardCreate} onChange={() => togglePerm(i, "dashboardCreate")} />
                                            Criar Reservas
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 14 }}>
                                            <input type="checkbox" checked={r.dashboardOverride} onChange={() => togglePerm(i, "dashboardOverride")} />
                                            Forçar Overrides
                                        </label>
                                    </div>

                                    <div>
                                        <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", margin: "0 0 12px 0" }}>Concessão e Praia</h4>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 14 }}>
                                            <input type="checkbox" checked={r.concessionAccess} onChange={() => togglePerm(i, "concessionAccess")} />
                                            Acesso e Controlo da Concessão
                                        </label>
                                    </div>

                                    <div>
                                        <h4 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", margin: "0 0 12px 0" }}>Gestão e Reportes</h4>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 14 }}>
                                            <input type="checkbox" checked={r.statisticsAccess} onChange={() => togglePerm(i, "statisticsAccess")} />
                                            Acesso a Estatísticas
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 14 }}>
                                            <input type="checkbox" checked={r.partnersAccess} onChange={() => togglePerm(i, "partnersAccess")} />
                                            Gestão de Parceiros
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 14 }}>
                                            <input type="checkbox" checked={r.adminAccess} onChange={() => togglePerm(i, "adminAccess")} />
                                            Acesso a Área de Administração (Users, Logs, Horários)
                                        </label>
                                        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 14 }}>
                                            <input type="checkbox" checked={r.shopifySync} onChange={() => togglePerm(i, "shopifySync")} />
                                            Sincronização com Shopify
                                        </label>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
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
