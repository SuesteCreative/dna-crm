"use client";

export const dynamic = "force-dynamic";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { UserCircle, Save, Lock, CheckCircle, AlertCircle } from "lucide-react";
import "./profile.css";

export default function ProfilePage() {
    const { isLoaded, isSignedIn, user } = useUser();

    const [form, setForm] = useState({
        requestName: "",
        companyName: "",
        nif: "",
        phone: "",
        website: "",
    });
    const [formLoaded, setFormLoaded] = useState(false);

    // Load from unsafeMetadata once user is available
    if (user && !formLoaded) {
        setForm({
            requestName: (user.unsafeMetadata?.requestName as string) || "",
            companyName: (user.unsafeMetadata?.companyName as string) || "",
            nif: (user.unsafeMetadata?.nif as string) || "",
            phone: (user.unsafeMetadata?.phone as string) || "",
            website: (user.unsafeMetadata?.website as string) || "",
        });
        setFormLoaded(true);
    }

    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const isEmailUser = user?.primaryEmailAddress && !user?.externalAccounts?.length;

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setSaveMsg(null);
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
            setSaveMsg({ type: "success", text: "Perfil guardado com sucesso." });
        } catch {
            setSaveMsg({ type: "error", text: "Erro ao guardar. Tente novamente." });
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 4000);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (pwForm.next !== pwForm.confirm) {
            setPwMsg({ type: "error", text: "As palavras-passe não coincidem." });
            return;
        }
        if (pwForm.next.length < 8) {
            setPwMsg({ type: "error", text: "A palavra-passe deve ter pelo menos 8 caracteres." });
            return;
        }
        setPwSaving(true);
        setPwMsg(null);
        try {
            await user.updatePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
            setPwMsg({ type: "success", text: "Palavra-passe alterada com sucesso." });
            setPwForm({ current: "", next: "", confirm: "" });
        } catch (err: any) {
            setPwMsg({ type: "error", text: err?.errors?.[0]?.message || "Erro ao alterar a palavra-passe." });
        } finally {
            setPwSaving(false);
            setTimeout(() => setPwMsg(null), 5000);
        }
    };

    if (!isLoaded) return null;
    if (!isSignedIn) return <RedirectToSignIn />;

    const profileFields = [
        { label: "Nome", key: "requestName", placeholder: "O seu nome completo" },
        { label: "Nome da Empresa (opcional)", key: "companyName", placeholder: "Ex: Hotel Alvor" },
        { label: "NIF (opcional)", key: "nif", placeholder: "Ex: 123456789" },
        { label: "Telemóvel (opcional)", key: "phone", placeholder: "Ex: +351 912 345 678" },
        { label: "Website (opcional)", key: "website", placeholder: "Ex: https://..." },
    ];

    return (
        <div className="profile-root">
            <header className="profile-header">
                <div className="profile-header-icon">
                    <UserCircle size={22} />
                </div>
                <div>
                    <h1 className="profile-title">Meu Perfil</h1>
                    <p className="profile-sub">Gerencie as suas informações pessoais e de acesso.</p>
                </div>
            </header>

            <div className="profile-grid">
                {/* Profile info card */}
                <div className="profile-card">
                    <div className="profile-card-title">Informação de Perfil</div>
                    <div className="profile-user-row">
                        <img src={user.imageUrl} alt="" className="profile-avatar" />
                        <div>
                            <div className="profile-user-name">{user.fullName || user.username || "—"}</div>
                            <div className="profile-user-email">{user.primaryEmailAddress?.emailAddress}</div>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="profile-form">
                        {profileFields.map(({ label, key, placeholder }) => (
                            <div key={key} className="profile-field">
                                <label className="profile-label">{label}</label>
                                <input
                                    type="text"
                                    className="profile-input"
                                    value={form[key as keyof typeof form]}
                                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                                    placeholder={placeholder}
                                />
                            </div>
                        ))}

                        {saveMsg && (
                            <div className={`profile-msg ${saveMsg.type}`}>
                                {saveMsg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {saveMsg.text}
                            </div>
                        )}

                        <button type="submit" className="profile-btn-primary" disabled={saving}>
                            <Save size={14} />
                            {saving ? "A guardar..." : "Guardar Perfil"}
                        </button>
                    </form>
                </div>

                {/* Password card — only for email/password users */}
                {isEmailUser && (
                    <div className="profile-card">
                        <div className="profile-card-title">Alterar Palavra-passe</div>
                        <p className="profile-pw-hint">
                            Escolha uma palavra-passe segura com pelo menos 8 caracteres.
                        </p>

                        <form onSubmit={handleChangePassword} className="profile-form">
                            <div className="profile-field">
                                <label className="profile-label">Palavra-passe atual</label>
                                <input
                                    type="password"
                                    className="profile-input"
                                    value={pwForm.current}
                                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="profile-field">
                                <label className="profile-label">Nova palavra-passe</label>
                                <input
                                    type="password"
                                    className="profile-input"
                                    value={pwForm.next}
                                    onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="profile-field">
                                <label className="profile-label">Confirmar nova palavra-passe</label>
                                <input
                                    type="password"
                                    className="profile-input"
                                    value={pwForm.confirm}
                                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {pwMsg && (
                                <div className={`profile-msg ${pwMsg.type}`}>
                                    {pwMsg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    {pwMsg.text}
                                </div>
                            )}

                            <button type="submit" className="profile-btn-secondary" disabled={pwSaving}>
                                <Lock size={14} />
                                {pwSaving ? "A alterar..." : "Alterar Palavra-passe"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
