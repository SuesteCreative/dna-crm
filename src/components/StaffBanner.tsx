"use client";

import { useStaffRequests } from "@/contexts/StaffRequestContext";
import { X, Check } from "lucide-react";

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export function StaffBanner() {
  const { requests, pendingCount, dismiss } = useStaffRequests();

  if (pendingCount === 0) return null;

  return (
    <div className="staff-banner-fixed">
      <span className="staff-banner-count">
        🔔 {pendingCount} pedido{pendingCount !== 1 ? "s" : ""}
      </span>
      <div className="staff-banner-items">
        {requests.map((r) => (
          <div key={r.id} className={`staff-banner-chip ${r.requestType === "PAYMENT" ? "payment" : "assist"}`}>
            <span className="staff-banner-chip-icon">
              {r.requestType === "PAYMENT" ? "💳" : "🙋"}
            </span>
            <span className="staff-banner-chip-text">
              <strong>{r.concessionName} · Chapéu {r.spotNumber}</strong>
              {r.clientName && <> · {r.clientName}</>}
              <span className="staff-banner-chip-time"> {timeLabel(r.createdAt)}</span>
            </span>
            <button
              className="staff-banner-chip-btn attend"
              title="Atendido"
              onClick={() => dismiss(r.id, "ATTENDED")}
            >
              <Check size={13} />
            </button>
            <button
              className="staff-banner-chip-btn dismiss"
              title="Dispensar"
              onClick={() => dismiss(r.id, "DISMISSED")}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
