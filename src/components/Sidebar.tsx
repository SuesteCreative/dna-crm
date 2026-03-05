"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
    LayoutDashboard, Waves, Users, ShoppingBag,
    Activity, ChevronRight, RefreshCcw
} from "lucide-react";
import { useState } from "react";

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [syncing, setSyncing] = useState(false);

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/" },
        { id: "services", label: "Serviços", icon: Waves, path: "/services" },
        { id: "partners", label: "Parceiros", icon: Users, path: "/partners" },
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
                <div className="brand-icon"><Activity size={20} /></div>
                <span className="brand-name">DNA CRM</span>
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
            </nav>

            <div className="sidebar-user">
                <UserButton afterSignOutUrl="/sign-in" showName />
            </div>
        </aside>
    );
}
