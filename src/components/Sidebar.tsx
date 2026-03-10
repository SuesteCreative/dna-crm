"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import {
    LayoutDashboard, Waves, Users, ShoppingBag,
    ChevronRight, RefreshCcw, Shield, BarChart2, Clock, AlertTriangle, UserCircle, Bug, X, Menu, Send, TreePalm, CalendarCheck, BookUser
} from "lucide-react";
import { useState, useEffect } from "react";

export function Sidebar() {
    const { userId, sessionClaims } = useAuth();
    const { user } = useUser();
    const pathname = usePathname();
    const router = useRouter();
    const [syncing, setSyncing] = useState(false);
    const [showBugReport, setShowBugReport] = useState(false);
    const [bugForm, setBugForm] = useState({ subject: "", description: "" });
    const [bugSent, setBugSent] = useState(false);
    const [bugSending, setBugSending] = useState(false);
    const [bugError, setBugError] = useState<string | null>(null);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [perms, setPerms] = useState<any>(null);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (userId) {
            fetch("/api/user/permissions")
                .then(r => r.json())
                .then(setPerms)
                .catch(console.error);
        }
    }, [userId]);

    // Body scroll lock
    useEffect(() => {
        const isLock = isMobileOpen || showBugReport;
        document.body.classList.toggle("modal-open", isLock);
        return () => document.body.classList.remove("modal-open");
    }, [isMobileOpen, showBugReport]);

    if (!userId) return null;
    if (pathname.startsWith("/pending") || pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up") || pathname.startsWith("/check-in")) return null;

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;

    // Safefalls in case perms aren't loaded yet
    const canSeePartners = perms ? perms.partnersAccess : role === "SUPER_ADMIN" || role === "ADMIN";
    const canSeeStats = perms ? perms.statisticsAccess : role !== "USER";
    const canSyncShopify = perms ? perms.shopifySync : role === "SUPER_ADMIN" || role === "ADMIN";
    const canSeeConcession = perms ? perms.concessionAccess : role === "SUPER_ADMIN" || role === "ADMIN";
    const canSeeAdmin = perms ? perms.adminAccess : role === "SUPER_ADMIN" || role === "ADMIN";

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

    const handleBugSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBugSending(true);
        setBugError(null);
        try {
            const res = await fetch("/api/bug-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: bugForm.subject,
                    description: bugForm.description,
                    senderEmail: user?.primaryEmailAddress?.emailAddress,
                }),
            });
            if (res.ok) {
                setBugSent(true);
                setTimeout(() => {
                    setShowBugReport(false);
                    setBugForm({ subject: "", description: "" });
                    setBugSent(false);
                }, 2000);
            } else {
                setBugError("Erro ao enviar. Tente novamente.");
            }
        } catch {
            setBugError("Erro de ligação.");
        } finally {
            setBugSending(false);
        }
    };

    return (
        <>
            <div className="mobile-header">
                <button className="mobile-menu-btn" onClick={() => setIsMobileOpen(true)}>
                    <Menu size={24} />
                </button>
                <img src="/SVG/logo-white.svg" alt="DNA" className="mobile-logo" />
                <div style={{ width: 40 }} /> {/* Spacer to center logo */}
            </div>

            <div
                className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
                onClick={() => setIsMobileOpen(false)}
            />

            <aside className={`crm-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
                <div className="brand">
                    <div style={{ display: 'flex', width: '100%', justifyContent: isMobileOpen ? 'space-between' : 'center', alignItems: 'center' }}>
                        <a href="https://desportosnauticosalvor.com/" target="_blank" rel="noopener noreferrer">
                            <img src="/SVG/logo-white.svg" alt="DNA" style={{ height: 60, width: "auto", display: "block" }} />
                        </a>
                        <button className="mobile-menu-btn" style={{ display: isMobileOpen ? 'flex' : 'none' }} onClick={() => setIsMobileOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>
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

                    <button
                        className={`nav-item ${pathname === "/availability" ? "active" : ""}`}
                        onClick={() => router.push("/availability")}
                    >
                        <CalendarCheck size={18} />
                        <span>Disponibilidade</span>
                        {pathname === "/availability" && <ChevronRight size={14} className="nav-arrow" />}
                    </button>

                    {canSeePartners && (
                        <button
                            className={`nav-item ${pathname === "/partners" ? "active" : ""}`}
                            onClick={() => router.push("/partners")}
                        >
                            <Users size={18} />
                            <span>Parceiros</span>
                            {pathname === "/partners" && <ChevronRight size={14} className="nav-arrow" />}
                        </button>
                    )}

                    {canSeeStats && (
                        <button
                            className={`nav-item ${pathname === "/statistics" ? "active" : ""}`}
                            onClick={() => router.push("/statistics")}
                        >
                            <BarChart2 size={18} />
                            <span>Estatísticas</span>
                            {pathname === "/statistics" && <ChevronRight size={14} className="nav-arrow" />}
                        </button>
                    )}

                    <button
                        className={`nav-item ${pathname === "/profile" ? "active" : ""}`}
                        onClick={() => router.push("/profile")}
                    >
                        <UserCircle size={18} />
                        <span>Meu Perfil</span>
                        {pathname === "/profile" && <ChevronRight size={14} className="nav-arrow" />}
                    </button>

                    {canSyncShopify && (
                        <>
                            <p className="nav-label">Integrações</p>
                            <button className="nav-item" onClick={handleSync} disabled={syncing}>
                                <ShoppingBag size={18} />
                                <span>{syncing ? "Sincronizando..." : "Sync Shopify"}</span>
                                {syncing && <RefreshCcw size={14} className="spin" />}
                            </button>
                        </>
                    )}

                    {canSeeConcession && (
                        <button
                            className={`nav-item ${pathname.startsWith("/concessao") ? "active" : ""}`}
                            onClick={() => router.push("/concessao")}
                        >
                            <TreePalm size={18} />
                            <span>Concessão</span>
                            {pathname.startsWith("/concessao") && <ChevronRight size={14} className="nav-arrow" />}
                        </button>
                    )}

                    {(role === "ADMIN" || role === "SUPER_ADMIN") && (
                        <button
                            className={`nav-item ${pathname === "/customers" ? "active" : ""}`}
                            onClick={() => router.push("/customers")}
                        >
                            <BookUser size={18} />
                            <span>Clientes</span>
                            {pathname === "/customers" && <ChevronRight size={14} className="nav-arrow" />}
                        </button>
                    )}

                    {canSeeAdmin && (
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
                                <span>Logs Reservas</span>
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
                            {bugError && <div className="bug-error">{bugError}</div>}
                            <div className="bug-modal-footer">
                                <button type="button" className="bug-btn-cancel" onClick={() => setShowBugReport(false)}>Cancelar</button>
                                <button type="submit" className="bug-btn-send" disabled={bugSent || bugSending}>
                                    <Send size={13} />
                                    {bugSent ? "Enviado!" : bugSending ? "A enviar..." : "Enviar Relatório"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
