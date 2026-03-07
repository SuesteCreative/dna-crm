"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
    LayoutDashboard, Waves, Users, ShoppingBag,
    ChevronRight, RefreshCcw, Shield, BarChart2, Clock, AlertTriangle, UserCircle
} from "lucide-react";
import { useState } from "react";

export function Sidebar() {
    const { userId, sessionClaims } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [syncing, setSyncing] = useState(false);

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

    return (
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
    );
}
