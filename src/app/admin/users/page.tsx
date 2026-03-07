"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Users, Shield, RefreshCcw, ChevronDown } from "lucide-react";
import "./admin-users.css";

interface CrmUser {
    id: string;
    name: string;
    email: string;
    imageUrl: string;
    role: string;
    partnerId: string | null;
    createdAt: number;
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

export default function AdminUsersPage() {
    const { isLoaded, isSignedIn } = useUser();
    const [users, setUsers] = useState<CrmUser[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
    const [pendingPartners, setPendingPartners] = useState<Record<string, string>>({});

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
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => {
                                const changed =
                                    pendingRoles[u.id] !== u.role ||
                                    (pendingPartners[u.id] || "") !== (u.partnerId || "");
                                return (
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
                                            <span className={`role-badge ${ROLE_COLORS[u.role] || "role-user"}`}>
                                                {ROLE_LABELS[u.role] || u.role}
                                            </span>
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
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
