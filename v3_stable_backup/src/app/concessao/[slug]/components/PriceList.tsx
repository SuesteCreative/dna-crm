"use client";
import { useState } from "react";

interface Concession {
  name: string;
  priceFull: number;
  priceMorning: number;
  priceAfternoon: number;
  priceExtraBed: number;
  priceOneBed: number;
}

type Lang = "pt" | "en" | "es" | "fr" | "de" | "zh" | "ru";

const FLAG_CODES: Record<Lang, string> = {
  pt: "pt", en: "gb", es: "es", fr: "fr", de: "de", zh: "cn", ru: "ru",
};

const LABELS: Record<Lang, {
  title: string; subtitle: string;
  fullDay: string; morning: string; afternoon: string; extraBed: string; oneBed: string;
  fullDayDesc: string; morningDesc: string; afternoonDesc: string; extraBedDesc: string; oneBedDesc: string;
  perSpot: string; includes: string;
}> = {
  pt: {
    title: "Preçário", subtitle: "Todos os preços por espreguiçadeira/chapéu",
    fullDay: "Dia Inteiro", morning: "Manhã", afternoon: "Tarde", extraBed: "Cama Extra", oneBed: "Chapéu + 1 Cama",
    fullDayDesc: "2 espreguiçadeiras + chapéu", morningDesc: "09h00 – 14h00", afternoonDesc: "14h00 – 19h00",
    extraBedDesc: "Adicional por cama extra", oneBedDesc: "Apenas 1 espreguiçadeira",
    perSpot: "por lugar", includes: "Inclui",
  },
  en: {
    title: "Price List", subtitle: "All prices per lounger/umbrella",
    fullDay: "Full Day", morning: "Morning", afternoon: "Afternoon", extraBed: "Extra Lounger", oneBed: "Umbrella + 1 Lounger",
    fullDayDesc: "2 loungers + umbrella", morningDesc: "09:00 – 14:00", afternoonDesc: "14:00 – 19:00",
    extraBedDesc: "Add-on per extra lounger", oneBedDesc: "1 lounger only",
    perSpot: "per spot", includes: "Includes",
  },
  es: {
    title: "Tarifas", subtitle: "Todos los precios por tumbona/sombrilla",
    fullDay: "Día Completo", morning: "Mañana", afternoon: "Tarde", extraBed: "Tumbona Extra", oneBed: "Sombrilla + 1 Tumbona",
    fullDayDesc: "2 tumbonas + sombrilla", morningDesc: "09:00 – 14:00", afternoonDesc: "14:00 – 19:00",
    extraBedDesc: "Adicional por tumbona extra", oneBedDesc: "Solo 1 tumbona",
    perSpot: "por lugar", includes: "Incluye",
  },
  fr: {
    title: "Tarifs", subtitle: "Tous les prix par transat/parasol",
    fullDay: "Journée Complète", morning: "Matin", afternoon: "Après-midi", extraBed: "Transat Supplémentaire", oneBed: "Parasol + 1 Transat",
    fullDayDesc: "2 transats + parasol", morningDesc: "09h00 – 14h00", afternoonDesc: "14h00 – 19h00",
    extraBedDesc: "Supplément par transat", oneBedDesc: "1 transat seulement",
    perSpot: "par place", includes: "Comprend",
  },
  de: {
    title: "Preisliste", subtitle: "Alle Preise pro Liegestuhl/Sonnenschirm",
    fullDay: "Ganztägig", morning: "Vormittag", afternoon: "Nachmittag", extraBed: "Extra Liegestuhl", oneBed: "Sonnenschirm + 1 Liegestuhl",
    fullDayDesc: "2 Liegestühle + Sonnenschirm", morningDesc: "09:00 – 14:00", afternoonDesc: "14:00 – 19:00",
    extraBedDesc: "Aufpreis pro Liegestuhl", oneBedDesc: "Nur 1 Liegestuhl",
    perSpot: "pro Platz", includes: "Inklusive",
  },
  zh: {
    title: "价格表", subtitle: "每个沙滩椅/遮阳伞的价格",
    fullDay: "全天", morning: "上午", afternoon: "下午", extraBed: "额外躺椅", oneBed: "遮阳伞 + 1 张躺椅",
    fullDayDesc: "2 张躺椅 + 遮阳伞", morningDesc: "09:00 – 14:00", afternoonDesc: "14:00 – 19:00",
    extraBedDesc: "每张额外躺椅附加费", oneBedDesc: "仅 1 张躺椅",
    perSpot: "每个位置", includes: "包括",
  },
  ru: {
    title: "Прайс-лист", subtitle: "Все цены за шезлонг/зонт",
    fullDay: "Весь день", morning: "Утро", afternoon: "Вечер", extraBed: "Доп. шезлонг", oneBed: "Зонт + 1 шезлонг",
    fullDayDesc: "2 шезлонга + зонт", morningDesc: "09:00 – 14:00", afternoonDesc: "14:00 – 19:00",
    extraBedDesc: "Доплата за доп. шезлонг", oneBedDesc: "Только 1 шезлонг",
    perSpot: "за место", includes: "Включает",
  },
};

export default function PriceList({ concession }: { concession: Concession }) {
  const [lang, setLang] = useState<Lang>("pt");
  const L = LABELS[lang];

  const items = [
    { label: L.fullDay, desc: L.fullDayDesc, price: concession.priceFull, highlight: true },
    { label: L.morning, desc: L.morningDesc, price: concession.priceMorning, highlight: false },
    { label: L.afternoon, desc: L.afternoonDesc, price: concession.priceAfternoon, highlight: false },
    { label: L.extraBed, desc: L.extraBedDesc, price: concession.priceExtraBed, highlight: false, isAddon: true },
    { label: L.oneBed, desc: L.oneBedDesc, price: concession.priceOneBed, highlight: false, isAddon: false },
  ];

  return (
    <div className="price-list-container">
      {/* Language switcher */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(Object.keys(FLAG_CODES) as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.35rem",
              padding: "0.3rem 0.6rem",
              borderRadius: 7,
              border: "1px solid",
              borderColor: lang === l ? "#f97316" : "rgba(255,255,255,0.1)",
              background: lang === l ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)",
              color: lang === l ? "#f97316" : "#aaa",
              cursor: "pointer",
              fontSize: "0.84rem",
              fontWeight: lang === l ? 700 : 400,
              transition: "all 0.15s",
            }}
          >
            <img
              src={`https://flagcdn.com/w20/${FLAG_CODES[l]}.png`}
              alt={l}
              width={18}
              height={13}
              style={{ borderRadius: 2, objectFit: "cover" }}
            />
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Price card */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "1.2rem 1.4rem",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(249,115,22,0.08)",
        }}>
          <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#f1f1f1" }}>
            {concession.name} — {L.title}
          </h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#888" }}>{L.subtitle}</p>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {items.map((item, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  background: item.highlight ? "rgba(249,115,22,0.06)" : "transparent",
                }}
              >
                <td style={{ padding: "0.85rem 1.4rem" }}>
                  <div style={{ fontWeight: item.highlight ? 700 : 500, color: "#f1f1f1", fontSize: "0.92rem" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "#888", marginTop: 2 }}>
                    {L.includes}: {item.desc}
                  </div>
                </td>
                <td style={{ padding: "0.85rem 1.4rem", textAlign: "right", whiteSpace: "nowrap" }}>
                  <span style={{
                    fontSize: item.highlight ? "1.2rem" : "1rem",
                    fontWeight: 700,
                    color: item.highlight ? "#f97316" : "#f1f1f1",
                  }}>
                    {(item as any).isAddon ? "+" : ""}{item.price.toFixed(2)}€
                  </span>
                  <div style={{ fontSize: "0.72rem", color: "#888" }}>{L.perSpot}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
