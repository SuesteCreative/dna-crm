"use client";

import { UserButton } from "@clerk/nextjs";
import { Clock } from "lucide-react";

export default function PendingPage() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            background: "var(--bg)",
            gap: "24px",
            padding: "32px",
            textAlign: "center",
        }}>
            <img src="/SVG/logo-white.svg" alt="DNA" style={{ height: 64, width: "auto", marginBottom: 8 }} />

            <div style={{
                width: 64,
                height: 64,
                borderRadius: "16px",
                background: "rgba(245, 158, 11, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--amber)",
            }}>
                <Clock size={32} />
            </div>

            <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                    Acesso Pendente
                </h1>
                <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 380, lineHeight: 1.6 }}>
                    A sua conta foi criada com sucesso. Aguarde que um administrador atribua as suas permissões de acesso.
                </p>
            </div>

            <UserButton afterSignOutUrl="/sign-in" />
        </div>
    );
}
