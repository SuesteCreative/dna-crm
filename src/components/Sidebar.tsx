"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
    LayoutDashboard, Waves, Users, ShoppingBag,
    ChevronRight, RefreshCcw, Shield, BarChart2
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

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
        { id: "services", label: "Serviços", icon: Waves, path: "/services" },
        { id: "partners", label: "Parceiros", icon: Users, path: "/partners" },
        { id: "statistics", label: "Estatísticas", icon: BarChart2, path: "/statistics" },
    ];

    const handleSync = async () => {
        setSyncing(true);
        try {
            await fetch("/api/shopify/sync", { method: "POST" });
            // We don't handle the toast here, but we trigger the sync
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
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${pathname === item.path ? "active" : ""}`}
                        onClick={() => router.push(item.path)}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                        {pathname === item.path && <ChevronRight size={14} className="nav-arrow" />}
                    </button>
                ))}

                <p className="nav-label">Integrações</p>
                <button className="nav-item" onClick={handleSync} disabled={syncing}>
                    <ShoppingBag size={18} />
                    <span>{syncing ? "Sincronizando..." : "Sync Shopify"}</span>
                    {syncing && <RefreshCcw size={14} className="spin" />}
                </button>

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
                    </>
                )}
            </nav>

            <div className="sidebar-user">
                <UserButton
                    afterSignOutUrl="/sign-in"
                    showName
                    appearance={{
                        variables: {
                            colorText: "#f1f5f9",
                            colorTextSecondary: "#94a3b8",
                            colorBackground: "#111827",
                        },
                        elements: {
                            userButtonOuterIdentifier: { color: "#f1f5f9" },
                            userButtonIdentifier: { color: "#94a3b8" },
                        },
                    }}
                />
            </div>
        </aside>
    );
}
