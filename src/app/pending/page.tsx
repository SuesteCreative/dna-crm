"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Clock, CheckCircle } from "lucide-react";
import { useState } from "react";
import "./pending.css";

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
    const isSubmitted = saved || alreadySaved;

    const fields = [
        { label: "Nome", key: "requestName", required: true, placeholder: "O seu nome completo" },
        { label: "Nome da Empresa (opcional)", key: "companyName", required: false, placeholder: "Ex: Hotel Alvor" },
        { label: "NIF (opcional)", key: "nif", required: false, placeholder: "Ex: 123456789" },
        { label: "Telemóvel", key: "phone", required: false, placeholder: "Ex: +351 912 345 678" },
        { label: "Website (opcional)", key: "website", required: false, placeholder: "Ex: https://..." },
    ];

    return (
        <div className="pending-root">
            <div className="pending-card">
                <img src="/SVG/logo-white.svg" alt="DNA" className="pending-logo" />

                <div className="pending-badge">
                    <Clock size={28} />
                </div>

                <h1 className="pending-title">Acesso Pendente</h1>
                <p className="pending-sub">
                    A sua conta foi criada com sucesso. Aguarde que um administrador atribua as suas permissões de acesso.
                </p>

                <form onSubmit={handleSubmit} className="pending-form">
                    <div className="pending-form-title">
                        Complete o seu perfil
                    </div>

                    {fields.map(({ label, key, required, placeholder }) => (
                        <div key={key} className="pending-field">
                            <label className="pending-label">
                                {label}{required && " *"}
                            </label>
                            <input
                                type="text"
                                className="pending-input"
                                value={form[key as keyof typeof form]}
                                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                placeholder={placeholder}
                                required={required}
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={saving || isSubmitted}
                        className={`pending-submit ${isSubmitted ? "saved" : "unsaved"}`}
                    >
                        <CheckCircle size={14} />
                        {saving ? "A guardar..." : isSubmitted ? "Informação guardada" : "Guardar informação"}
                    </button>
                </form>

                <div className="pending-step">
                    <span className="pending-step-dot" />
                    Preencha os dados acima e aguarde aprovação
                </div>

                <div className="pending-signout">
                    <span>Sessão iniciada como {user?.primaryEmailAddress?.emailAddress}</span>
                    <UserButton afterSignOutUrl="/sign-in" />
                </div>
            </div>
        </div>
    );
}
