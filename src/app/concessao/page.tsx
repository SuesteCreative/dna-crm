"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { TreePalm, MapPin, LayoutGrid, Settings, ChevronRight, Loader2 } from "lucide-react";
import "./concessao.css";

interface Concession {
  id: string;
  slug: string;
  name: string;
  location: string;
  rows: number;
  cols: number;
  priceFull: number;
  priceMorning: number;
  priceAfternoon: number;
  priceExtraBed: number;
  priceOneBed: number;
  _count: { spots: number };
}

export default function ConcessaoPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const router = useRouter();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "STAFF";

  const [concessions, setConcessions] = useState<Concession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"selector" | "settings">("selector");

  // Pricing edit state
  const [prices, setPrices] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAdmin) { router.push("/pending"); return; }
    fetch("/api/concessions")
      .then((r) => r.json())
      .then((data) => {
        setConcessions(data);
        // Init price edit state
        const init: Record<string, Record<string, string>> = {};
        data.forEach((c: Concession) => {
          init[c.slug] = {
            priceFull: String(c.priceFull),
            priceMorning: String(c.priceMorning),
            priceAfternoon: String(c.priceAfternoon),
            priceExtraBed: String(c.priceExtraBed),
            priceOneBed: String(c.priceOneBed),
          };
        });
        setPrices(init);
        setLoading(false);
      });
  }, [isLoaded, isAdmin]);

  const handlePriceChange = (slug: string, field: string, value: string) => {
    setPrices((prev) => ({ ...prev, [slug]: { ...prev[slug], [field]: value } }));
  };

  const handleSeed = async () => {
    setSeeding(true);
    await fetch("/api/concessions/seed", { method: "POST" });
    const res = await fetch("/api/concessions");
    const data = await res.json();
    setConcessions(data);
    const init: Record<string, Record<string, string>> = {};
    data.forEach((c: Concession) => {
      init[c.slug] = {
        priceFull: String(c.priceFull), priceMorning: String(c.priceMorning),
        priceAfternoon: String(c.priceAfternoon), priceExtraBed: String(c.priceExtraBed),
        priceOneBed: String(c.priceOneBed),
      };
    });
    setPrices(init);
    setSeeding(false);
  };

  const handleSave = async (slug: string) => {
    setSaving((p) => ({ ...p, [slug]: true }));
    await fetch(`/api/concessions/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prices[slug]),
    });
    setSaving((p) => ({ ...p, [slug]: false }));
    setSaved((p) => ({ ...p, [slug]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [slug]: false })), 2000);
  };

  if (!isLoaded || loading) {
    return (
      <div className="conc-loading">
        <Loader2 size={32} className="conc-spin" />
      </div>
    );
  }

  return (
    <div className="conc-page">
      <div className="conc-header">
        <div className="conc-header-left">
          <TreePalm size={28} className="conc-header-icon" />
          <div>
            <h1 className="conc-title">Concessão</h1>
            <p className="conc-subtitle">Gestão de espreguiçadeiras e chapéus de praia</p>
          </div>
        </div>
        <div className="conc-tabs">
          <button
            className={`conc-tab ${tab === "selector" ? "active" : ""}`}
            onClick={() => setTab("selector")}
          >
            <LayoutGrid size={16} /> Concessões
          </button>
          <button
            className={`conc-tab ${tab === "settings" ? "active" : ""}`}
            onClick={() => setTab("settings")}
          >
            <Settings size={16} /> Definições
          </button>
        </div>
      </div>

      {tab === "selector" && concessions.length === 0 && (
        <div className="conc-empty">
          <TreePalm size={48} className="conc-empty-icon" />
          <p className="conc-empty-title">Sem concessões configuradas</p>
          <p className="conc-empty-sub">Clique no botão abaixo para criar as concessões Trópico e Subnauta com os lugares padrão.</p>
          <button className="conc-settings-save" style={{ maxWidth: 260 }} onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 size={15} className="conc-spin" /> : <TreePalm size={15} />}
            {seeding ? "A inicializar..." : "Inicializar Concessões"}
          </button>
        </div>
      )}

      {tab === "selector" && concessions.length > 0 && (
        <div className="conc-cards">
          {concessions.map((c) => (
            <button
              key={c.slug}
              className={`conc-card theme-${c.slug}`}
              onClick={() => router.push(`/concessao/${c.slug}`)}
            >
              <div className="conc-card-top">
                <TreePalm size={36} className="conc-card-icon" />
                <ChevronRight size={20} className="conc-card-arrow" />
              </div>
              <h2 className="conc-card-name">{c.name}</h2>
              <div className="conc-card-meta">
                <span><MapPin size={13} /> {c.location}</span>
                <span><LayoutGrid size={13} /> {c._count.spots} lugares ({c.rows}×{c.cols})</span>
              </div>
              <div className="conc-card-prices">
                <span>Dia Inteiro <strong>{c.priceFull.toFixed(2)}€</strong></span>
                <span>Manhã/Tarde <strong>{c.priceMorning.toFixed(2)}€</strong></span>
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "settings" && (
        <div className="conc-settings">
          {concessions.map((c) => (
            <div key={c.slug} className={`conc-settings-card theme-${c.slug}`}>
              <div className="conc-settings-card-header">
                <TreePalm size={20} />
                <h3>{c.name}</h3>
                <span className="conc-settings-meta">{c.location} · {c.rows}×{c.cols} lugares</span>
              </div>
              <div className="conc-settings-grid">
                {[
                  { field: "priceFull", label: "Dia Inteiro (2 camas)" },
                  { field: "priceMorning", label: "Manhã (09h–14h)" },
                  { field: "priceAfternoon", label: "Tarde (14h–19h)" },
                  { field: "priceExtraBed", label: "Cama extra" },
                  { field: "priceOneBed", label: "Chapéu + 1 cama" },
                ].map(({ field, label }) => (
                  <label key={field} className="conc-settings-field">
                    <span>{label}</span>
                    <div className="conc-settings-input-wrap">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={prices[c.slug]?.[field] ?? ""}
                        onChange={(e) => handlePriceChange(c.slug, field, e.target.value)}
                      />
                      <span className="conc-settings-euro">€</span>
                    </div>
                  </label>
                ))}
              </div>
              <button
                className={`conc-settings-save ${saved[c.slug] ? "saved" : ""}`}
                onClick={() => handleSave(c.slug)}
                disabled={saving[c.slug]}
              >
                {saving[c.slug] ? <Loader2 size={15} className="conc-spin" /> : null}
                {saved[c.slug] ? "Guardado!" : "Guardar preços"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
