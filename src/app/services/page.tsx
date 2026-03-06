"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Plus, RefreshCcw, Waves, Zap } from "lucide-react";
import "./services.css";

interface Service {
    id: string;
    name: string;
    variant: string | null;
    sku: string | null;
    price: number | null;
    imageUrl: string | null;
    category: string | null;
    isActive: boolean;
}

export default function ServicesPage() {
    const { isLoaded, isSignedIn } = useUser();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [seedMsg, setSeedMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isSignedIn) fetchServices();
    }, [isSignedIn]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/services");
            const data = await res.json();
            setServices(Array.isArray(data) ? data : []);
        } catch { setServices([]); }
        finally { setLoading(false); }
    };

    const handleSeed = async () => {
        setSeeding(true);
        setSeedMsg(null);
        try {
            const res = await fetch("/api/services/seed", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setSeedMsg(`${data.count} serviços importados com sucesso.`);
                await fetchServices();
            } else {
                setSeedMsg(`Erro: ${data.error}`);
            }
        } catch { setSeedMsg("Erro ao importar serviços."); }
        finally { setSeeding(false); setTimeout(() => setSeedMsg(null), 4000); }
    };

    if (!isLoaded) return null;
    if (!isSignedIn) return <RedirectToSignIn />;

    // Group by category
    const groups: Record<string, Service[]> = {};
    for (const s of services) {
        const cat = s.category || "Outros";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(s);
    }

    const catIcon = (cat: string) => {
        if (cat.toLowerCase().includes("jetski")) return <Zap size={16} />;
        return <Waves size={16} />;
    };

    return (
        <div className="svc-root">
            <div className="svc-header">
                <div>
                    <h1 className="svc-title">Serviços</h1>
                    <p className="svc-sub">Atividades disponíveis para reserva.</p>
                </div>
                <div className="svc-actions">
                    {seedMsg && <span className="seed-msg">{seedMsg}</span>}
                    <button className="btn-seed" onClick={handleSeed} disabled={seeding}>
                        <RefreshCcw size={15} className={seeding ? "spin" : ""} />
                        {seeding ? "A importar..." : "Importar do Shopify CSV"}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="svc-loading"><div className="loader" /></div>
            ) : Object.keys(groups).length === 0 ? (
                <div className="svc-empty">
                    <p>Nenhum serviço encontrado. Clique em "Importar do Shopify CSV" para começar.</p>
                </div>
            ) : (
                Object.entries(groups).map(([cat, items]) => (
                    <div key={cat} className="svc-group">
                        <div className="svc-group-label">
                            {catIcon(cat)} {cat}
                        </div>
                        <div className="svc-grid">
                            {items.map(svc => (
                                <div key={svc.id} className="svc-card">
                                    {svc.imageUrl && (
                                        <div className="svc-img-wrap">
                                            <img src={svc.imageUrl} alt={svc.name} className="svc-img" />
                                        </div>
                                    )}
                                    <div className="svc-info">
                                        <div className="svc-name">{svc.name}</div>
                                        {svc.variant && <div className="svc-variant">{svc.variant}</div>}
                                        <div className="svc-meta">
                                            {svc.sku && <span className="svc-sku">SKU: {svc.sku}</span>}
                                            {svc.price != null && (
                                                <span className="svc-price">{svc.price.toFixed(2)}€</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
