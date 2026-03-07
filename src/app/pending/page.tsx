"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Clock, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function PendingPage() {
    const { user } = useUser();
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        requestName: (user?.unsafeMetadata?.requestName as string) || user?.fullName || "",
        companyName: (user?.unsafeMetadata?.companyName as string) || "",
        nif: (user?.unsafeMetadata?.nif as string) || "",
        phone: (user?.unsafeMetadata?.phone as string) || "",
        website: (user?.unsafeMetadata?.website as string) || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        try {
            await user.update({
                unsafeMetadata: {
                    requestName: form.requestName,
                    companyName: form.companyName,
                    nif: form.nif,
                    phone: form.phone,
                    website: form.website,
                },
            });
            setSaved(true);
        } catch {
            alert("Erro ao guardar. Tente novamente.");
        } finally {
            setSaving(false);
        }
    };

    const alreadySaved = !!(user?.unsafeMetadata?.requestName || user?.unsafeMetadata?.companyName);

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

            {/* Info form */}
            <form onSubmit={handleSubmit} style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "24px",
                width: "100%",
                maxWidth: 420,
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
                gap: 14,
            }}>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                    Preencha os seus dados para facilitar o processo de aprovação:
                </p>

                {[
                    { label: "Nome", key: "requestName", required: true, placeholder: "O seu nome completo" },
                    { label: "Nome da Empresa (opcional)", key: "companyName", required: false, placeholder: "Ex: Hotel Alvor" },
                    { label: "NIF (opcional)", key: "nif", required: false, placeholder: "Ex: 123456789" },
                    { label: "Telemóvel", key: "phone", required: false, placeholder: "Ex: +351 912 345 678" },
                    { label: "Website (opcional)", key: "website", required: false, placeholder: "Ex: https://..." },
                ].map(({ label, key, required, placeholder }) => (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>
                            {label}{required && " *"}
                        </label>
                        <input
                            type="text"
                            value={form[key as keyof typeof form]}
                            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder={placeholder}
                            required={required}
                            style={{
                                background: "var(--bg)",
                                border: "1px solid var(--border)",
                                borderRadius: 7,
                                padding: "8px 11px",
                                fontSize: 13,
                                color: "var(--text)",
                                outline: "none",
                                width: "100%",
                            }}
                        />
                    </div>
                ))}

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        marginTop: 4,
                        background: saved || alreadySaved ? "var(--green, #22c55e)" : "var(--primary)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 7,
                        padding: "9px 18px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: saving ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        opacity: saving ? 0.7 : 1,
                    }}
                >
                    {(saved || alreadySaved) && <CheckCircle size={14} />}
                    {saving ? "A guardar..." : (saved || alreadySaved) ? "Informação guardada" : "Guardar informação"}
                </button>
            </form>

            <UserButton afterSignOutUrl="/sign-in" />
        </div>
    );
}
