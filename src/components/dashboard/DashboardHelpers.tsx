import React from "react";
import { Booking } from "./types";

export const PARTNER_PALETTE: { bg: string; text: string }[] = [
  { bg: "rgba(59,130,246,.18)", text: "#3b82f6" }, // blue
  { bg: "rgba(20,184,166,.18)", text: "#14b8a6" }, // teal
  { bg: "rgba(168,85,247,.18)", text: "#a855f7" }, // purple
  { bg: "rgba(245,158,11,.18)", text: "#f59e0b" }, // amber
  { bg: "rgba(236,72,153,.18)", text: "#ec4899" }, // pink
  { bg: "rgba(34,197,94,.18)", text: "#22c55e" }, // green
  { bg: "rgba(249,115,22,.18)", text: "#f97316" }, // orange
];

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls: Record<string, string> = { CONFIRMED: "badge-confirmed", PENDING: "badge-pending", CANCELLED: "badge-cancelled" };
  const lbl: Record<string, string> = { CONFIRMED: "Confirmada", PENDING: "Pendente", CANCELLED: "Cancelada" };
  return <span className={`badge ${cls[status] || "badge-pending"}`}>{lbl[status] || status}</span>;
};

interface SourceBadgeProps {
  source: string;
  orderNumber?: string | null;
  partnerId?: string | null;
  partners: { id: string; name: string }[];
  partnerColorMap: Map<string, { bg: string; text: string }>;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ 
  source, orderNumber, partnerId, partners, partnerColorMap 
}) => {
  if (source === "PARTNER" && partnerId) {
    const partner = partners.find(p => p.id === partnerId);
    const color = partnerColorMap.get(partnerId) ?? PARTNER_PALETTE[0];
    return (
      <div className="source-stack">
        <span className="src-badge" style={{ background: color.bg, color: color.text }}>
          {partner?.name ?? "Parceiro"}
        </span>
        {orderNumber && <span className="order-no-sub">{orderNumber}</span>}
      </div>
    );
  }
  const cls: Record<string, string> = { SHOPIFY: "src-shopify", MANUAL: "src-manual", PARTNER: "src-partner" };
  return (
    <div className="source-stack">
      <span className={`src-badge ${cls[source] || "src-manual"}`}>{source}</span>
      {orderNumber && <span className="order-no-sub">{orderNumber}</span>}
    </div>
  );
};

export function recalcPrice(unitPrice: number | null, qtyOrPax: number, discAmt: string, discType: string, bookingFee: string = ""): string {
  if (unitPrice == null) return "";
  const base = unitPrice * qtyOrPax;
  const d = parseFloat(discAmt) || 0;
  let discounted = base;
  if (d > 0) {
    discounted = discType === "%" ? base * (1 - d / 100) : base - d;
  }
  const fee = parseFloat(bookingFee) || 0;
  const final = discounted - fee;
  return Math.max(0, final).toFixed(2);
}
