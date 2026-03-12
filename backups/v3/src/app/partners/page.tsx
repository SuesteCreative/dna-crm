"use client";

export const dynamic = "force-dynamic";
import { useUser, useAuth, RedirectToSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users, Plus, Search, Mail, Phone,
    MapPin, Globe, Loader2, X, AlertCircle
} from "lucide-react";
import "./partners.css";

interface Partner {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    commission: number;
}

const defaultForm = {
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    commission: 10
};

export default function PartnersPage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { sessionClaims } = useAuth();
    const router = useRouter();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Body scroll lock
    useEffect(() => {
        document.body.classList.toggle("modal-open", showModal);
        return () => document.body.classList.remove("modal-open");
    }, [showModal]);
    const [formData, setFormData] = useState(defaultForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isSignedIn) fetchPartners();
    }, [isSignedIn]);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/partners");
            const data = await res.json();
            setPartners(data || []);
        } catch { setPartners([]); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/partners/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData(defaultForm);
                fetchPartners();
            } else {
                const d = await res.json();
                setError(d.error || "Erro ao criar parceiro");
            }
        } catch { setError("Erro de rede"); }
        finally { setSubmitting(false); }
    };

    if (!isLoaded) return null;
    if (!isSignedIn) return <RedirectToSignIn />;
    if (role === "PARTNER") { router.replace("/"); return null; }

    return (
        <div className="ptn-root">
            <header className="ptn-header">
                <div>
                    <h1 className="ptn-title">Gestão de Parceiros</h1>
                    <p className="ptn-sub">Gerencie hotéis, agências e outros parceiros comerciais.</p>
                </div>
                <button className="ptn-btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Novo Parceiro
                </button>
            </header>

            {loading ? (
                <div className="ptn-loading"><Loader2 className="spin" /></div>
            ) : partners.length === 0 ? (
                <div className="ptn-empty">
                    <Users size={40} />
                    <p>Nenhum parceiro registado.</p>
                    <button className="ptn-empty-btn" onClick={() => setShowModal(true)}>Registrar Primeiro</button>
                </div>
            ) : (
                <div className="ptn-grid">
                    {partners.map(p => (
                        <div key={p.id} className="ptn-card">
                            <div className="ptn-card-hdr">
                                <div className="ptn-avatar">{p.name.charAt(0)}</div>
                                <div className="ptn-name-wrap">
                                    <h3 className="ptn-name">{p.name}</h3>
                                    <span className="ptn-comm">{p.commission}% Comissão</span>
                                </div>
                            </div>

                            <div className="ptn-details">
                                {p.email && <div className="ptn-item"><Mail size={14} /> <span>{p.email}</span></div>}
                                {p.phone && <div className="ptn-item"><Phone size={14} /> <span>{p.phone}</span></div>}
                                {p.address && <div className="ptn-item"><MapPin size={14} /> <span>{p.address}</span></div>}
                                {p.website && <div className="ptn-item"><Globe size={14} /> <span>{p.website}</span></div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-hdr">
                            <h2>Novo Parceiro</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="modal-form">
                            {error && <div className="form-error"><AlertCircle size={14} />{error}</div>}

                            <div className="form-grid">
                                <div className="field full">
                                    <label>Nome do Parceiro / Empresa *</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Email de Contacto</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Telefone</label>
                                    <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="field full">
                                    <label>Endereço</label>
                                    <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Website</label>
                                    <input type="url" placeholder="https://" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                                </div>
                                <div className="field">
                                    <label>Comissão (%)</label>
                                    <input type="number" min="0" max="100" value={formData.commission} onChange={e => setFormData({ ...formData, commission: parseInt(e.target.value) })} />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? "Criando..." : "Criar Parceiro"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
