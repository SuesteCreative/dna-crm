"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
    LayoutDashboard, Waves, Users, ShoppingBag,
    ChevronRight, RefreshCcw, Shield, BarChart2, Clock, AlertTriangle, UserCircle, Bug, X, Send
} from "lucide-react";
import { useState } from "react";

export function Sidebar() {
    const { userId, sessionClaims } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [syncing, setSyncing] = useState(false);
    const [showBugReport, setShowBugReport] = useState(false);
    const [bugForm, setBugForm] = useState({ subject: "", description: "" });
    const [bugSent, setBugSent] = useState(false);

    if (!userId) return null;
    if (pathname.startsWith("/pending") || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return null;

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
    const isPartner = role === "PARTNER";

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch("/api/shopify/sync", { method: "POST" });
            router.refresh();
        } catch (e) {
            console.error("Sync failed", e);
        } finally {
            setSyncing(false);
        }
    };

    const handleBugSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const subject = encodeURIComponent(`[Bug Report] ${bugForm.subject}`);
        const body = encodeURIComponent(bugForm.description);
        window.open(`mailto:booking@desportosnauticosalvor.com?subject=${subject}&body=${body}`, "_blank");
        setBugSent(true);
        setTimeout(() => {
            setShowBugReport(false);
            setBugForm({ subject: "", description: "" });
            setBugSent(false);
        }, 2000);
    };

    return (
        <>
        <aside className="crm-sidebar">
            <div className="brand">
                <img src="/SVG/logo-white.svg" alt="DNA" style={{ height: 52, width: "auto" }} />
            </div>

            <nav className="crm-nav">
                <p className="nav-label">Principal</p>

                <button
                    className={`nav-item ${pathname === "/" ? "active" : ""}`}
                    onClick={() => router.push("/")}
                >
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                    {pathname === "/" && <ChevronRight size={14} className="nav-arrow" />}
                </button>

                <button
                    className={`nav-item ${pathname === "/services" ? "active" : ""}`}
                    onClick={() => router.push("/services")}
                >
                    <Waves size={18} />
                    <span>Serviços</span>
                    {pathname === "/services" && <ChevronRight size={14} className="nav-arrow" />}
                </button>

                {!isPartner && (
                    <button
                        className={`nav-item ${pathname === "/partners" ? "active" : ""}`}
                        onClick={() => router.push("/partners")}
                    >
                        <Users size={18} />
                        <span>Parceiros</span>
                        {pathname === "/partners" && <ChevronRight size={14} className="nav-arrow" />}
                    </button>
                )}

                <button
                    className={`nav-item ${pathname === "/statistics" ? "active" : ""}`}
                    onClick={() => router.push("/statistics")}
                >
                    <BarChart2 size={18} />
                    <span>Estatísticas</span>
                    {pathname === "/statistics" && <ChevronRight size={14} className="nav-arrow" />}
                </button>

                <button
                    className={`nav-item ${pathname === "/profile" ? "active" : ""}`}
                    onClick={() => router.push("/profile")}
                >
                    <UserCircle size={18} />
                    <span>Meu Perfil</span>
                    {pathname === "/profile" && <ChevronRight size={14} className="nav-arrow" />}
                </button>

                {!isPartner && (
                    <>
                        <p className="nav-label">Integrações</p>
                        <button className="nav-item" onClick={handleSync} disabled={syncing}>
                            <ShoppingBag size={18} />
                            <span>{syncing ? "Sincronizando..." : "Sync Shopify"}</span>
                            {syncing && <RefreshCcw size={14} className="spin" />}
                        </button>
                    </>
                )}

                {isAdmin && (
                    <>
                        <p className="nav-label">Administração</p>
                        <button
                            className={`nav-item ${pathname === "/admin/users" ? "active" : ""}`}
                            onClick={() => router.push("/admin/users")}
                        >
                            <Shield size={18} />
                            <span>Utilizadores</span>
                            {pathname === "/admin/users" && <ChevronRight size={14} className="nav-arrow" />}
                        </button>
                        <button
                            className={`nav-item ${pathname === "/schedule" ? "active" : ""}`}
                            onClick={() => router.push("/schedule")}
                        >
                            <Clock size={18} />
                            <span>Horário</span>
                            {pathname === "/schedule" && <ChevronRight size={14} className="nav-arrow" />}
                        </button>
                        <button
                            className={`nav-item ${pathname === "/admin/logs" ? "active" : ""}`}
                            onClick={() => router.push("/admin/logs")}
                        >
                            <AlertTriangle size={18} />
                            <span>Logs Override</span>
                            {pathname === "/admin/logs" && <ChevronRight size={14} className="nav-arrow" />}
                        </button>
                    </>
                )}

                <div className="nav-spacer" />
                <button className="nav-item nav-bug-report" onClick={() => setShowBugReport(true)}>
                    <Bug size={18} />
                    <span>Reportar um Bug</span>
                </button>
            </nav>

            <div className="sidebar-user">
                <UserButton afterSignOutUrl="/sign-in" />
                <div className="sidebar-user-info">
                    <span className="sidebar-user-role">
                        {role === "SUPER_ADMIN" ? "Super Admin"
                            : role === "ADMIN" ? "Admin"
                            : role === "PARTNER" ? "Parceiro"
                            : "Utilizador"}
                    </span>
                </div>
            </div>
        </aside>

        {showBugReport && (
            <div className="bug-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowBugReport(false); }}>
                <div className="bug-modal">
                    <div className="bug-modal-hdr">
                        <div>
                            <div className="bug-modal-title">Reportar um Bug</div>
                            <div className="bug-modal-sub">A sua mensagem será enviada para a equipa DNA.</div>
                        </div>
                        <button className="bug-modal-close" onClick={() => setShowBugReport(false)}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleBugSubmit} className="bug-modal-body">
                        <div className="bug-field">
                            <label className="bug-label">Assunto *</label>
                            <input
                                type="text"
                                className="bug-input"
                                value={bugForm.subject}
                                onChange={e => setBugForm(f => ({ ...f, subject: e.target.value }))}
                                placeholder="Ex: Slot não está a bloquear"
                                required
                            />
                        </div>
                        <div className="bug-field">
                            <label className="bug-label">Descrição *</label>
                            <textarea
                                className="bug-input bug-textarea"
                                rows={5}
                                value={bugForm.description}
                                onChange={e => setBugForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Descreva o problema com o máximo de detalhe possível: o que fez, o que aconteceu e o que era esperado..."
                                required
                            />
                        </div>
                        <div className="bug-modal-footer">
                            <button type="button" className="bug-btn-cancel" onClick={() => setShowBugReport(false)}>Cancelar</button>
                            <button type="submit" className="bug-btn-send" disabled={bugSent}>
                                <Send size={13} />
                                {bugSent ? "A abrir email..." : "Enviar Relatório"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
}
