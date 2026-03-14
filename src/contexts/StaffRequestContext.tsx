"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface PendingRequest {
  id: string;
  spotNumber: number;
  concessionName: string;
  concessionSlug: string;
  requestType: "PAYMENT" | "ASSISTANCE";
  clientName: string | null;
  createdAt: string;
}

interface StaffRequestContextValue {
  requests: PendingRequest[];
  pendingCount: number;
  dismiss: (id: string, status: "ATTENDED" | "DISMISSED") => Promise<void>;
}

const StaffRequestContext = createContext<StaffRequestContextValue>({
  requests: [],
  pendingCount: 0,
  dismiss: async () => {},
});

function playBeep() {
  try {
    const ctx = new AudioContext();
    // Two quick beeps
    [0, 0.25].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
  } catch {
    // AudioContext blocked (requires user interaction first) — fail silently
  }
}

export function StaffRequestProvider({ children }: { children: React.ReactNode }) {
  const { userId, sessionClaims } = useAuth();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  const isStaff = role === "ADMIN" || role === "SUPER_ADMIN" || role === "STAFF";

  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isFirstFetch = useRef(true);

  const showBrowserNotification = useCallback((req: PendingRequest) => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    const type = req.requestType === "PAYMENT" ? "Pagamento em Numerário" : "Assistência";
    new Notification(`🏖 Pedido de ${type}`, {
      body: `${req.concessionName} · Chapéu ${req.spotNumber}${req.clientName ? ` · ${req.clientName}` : ""}`,
      tag: req.id,
      requireInteraction: true,
    });
  }, []);

  const fetchRequests = useCallback(async () => {
    if (!userId || !isStaff) return;
    try {
      const res = await fetch("/api/concessions/pending-requests");
      if (!res.ok) return;
      const data: PendingRequest[] = await res.json();

      if (!isFirstFetch.current) {
        const newOnes = data.filter((r) => !seenIdsRef.current.has(r.id));
        if (newOnes.length > 0) {
          playBeep();
          if (typeof Notification !== "undefined") {
            if (Notification.permission === "default") {
              Notification.requestPermission().then((perm) => {
                if (perm === "granted") newOnes.forEach(showBrowserNotification);
              });
            } else {
              newOnes.forEach(showBrowserNotification);
            }
          }
        }
      }

      data.forEach((r) => seenIdsRef.current.add(r.id));
      isFirstFetch.current = false;
      setRequests(data);
    } catch {
      // Network error — fail silently, try again next poll
    }
  }, [userId, isStaff, showBrowserNotification]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  // Add/remove body class so .crm-main can compensate for the banner
  useEffect(() => {
    document.body.classList.toggle("has-staff-banner", requests.length > 0);
    return () => document.body.classList.remove("has-staff-banner");
  }, [requests.length]);

  const dismiss = useCallback(async (id: string, status: "ATTENDED" | "DISMISSED") => {
    await fetch(`/api/concessions/staff-request/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRequests((prev) => prev.filter((r) => r.id !== id));
    seenIdsRef.current.add(id);
  }, []);

  return (
    <StaffRequestContext.Provider value={{ requests, pendingCount: requests.length, dismiss }}>
      {children}
    </StaffRequestContext.Provider>
  );
}

export const useStaffRequests = () => useContext(StaffRequestContext);
