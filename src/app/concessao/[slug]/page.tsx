"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { TreePalm, Waves, ArrowLeft, LayoutGrid, CalendarDays, BookOpen, Calculator, Bell, X, Check, XCircle, ExternalLink } from "lucide-react";
import DailyControl from "./components/DailyControl";
import Reservations from "./components/Reservations";
import type { ReservationInitData } from "./components/Reservations";
import PriceList from "./components/PriceList";
import CalcComponent from "./components/Calculator";
import "./concessao-detail.css";

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
  spots: { id: string; spotNumber: number; row: number; col: number; isActive: boolean }[];
}

interface StaffRequest {
  id: string;
  clientName: string | null;
  createdAt: string;
  spot: { spotNumber: number };
  status: string;
}

type Tab = "controlo" | "reservas" | "precario" | "calculadora";

export default function ConcessaoDetailPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const role = (sessionClaims as any)?.metadata?.role as string | undefined;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "STAFF";

  const [concession, setConcession] = useState<Concession | null>(null);
  const [tab, setTab] = useState<Tab>("controlo");
  const [reservationInit, setReservationInit] = useState<ReservationInitData | null>(null);

  // Staff requests
  const [staffRequests, setStaffRequests] = useState<StaffRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const handleCalcProceed = (data: ReservationInitData) => {
    setReservationInit(data);
    setTab("reservas");
  };

  const fetchStaffRequests = async (slug: string) => {
    try {
      const res = await fetch(`/api/concessions/${slug}/staff-requests`);
      if (res.ok) setStaffRequests(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAdmin) { router.push("/pending"); return; }
    fetch(`/api/concessions/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/concessao"); return; }
        setConcession(data);
        fetchStaffRequests(params.slug);
        pollRef.current = setInterval(() => fetchStaffRequests(params.slug), 10000);
      });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isLoaded, isAdmin, params.slug]);

  const handleRequestAction = async (id: string, status: "ATTENDED" | "DISMISSED") => {
    await fetch(`/api/concessions/staff-request/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setStaffRequests((prev) => prev.filter((r) => r.id !== id));
  };

  if (!concession) {
    return (
      <div className="cd-loading">
        <TreePalm size={32} className="cd-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "controlo", label: "Controlo Diário", icon: <LayoutGrid size={15} /> },
    { id: "reservas", label: "Reservas", icon: <BookOpen size={15} /> },
    { id: "precario", label: "Preçário", icon: <CalendarDays size={15} /> },
    { id: "calculadora", label: "Calculadora", icon: <Calculator size={15} /> },
  ];

  return (
    <div className={`cd-page theme-${concession.slug}`}>
      <div className="cd-header">
        <button className="cd-back" onClick={() => router.push("/concessao")}>
          <ArrowLeft size={16} /> Concessões
        </button>
        <div className="cd-title-row">
          {concession.slug === "subnauta" ? <Waves size={24} className="cd-title-icon" /> : <TreePalm size={24} className="cd-title-icon" />}
          <h1 className="cd-title">{concession.name}</h1>
          <span className="cd-loc">{concession.location}</span>
          {/* Preview customer page */}
          <a
            href={`/concessao/book/${concession.slug}/1`}
            target="_blank"
            rel="noopener noreferrer"
            className="cd-preview-btn"
            title="Ver página do cliente (Chapéu 1)"
          >
            <ExternalLink size={16} />
          </a>
          {/* Staff requests bell */}
          <button
            className={`cd-bell-btn ${staffRequests.length > 0 ? "cd-bell-active" : ""}`}
            onClick={() => setShowRequests((v) => !v)}
            title="Pedidos de Staff"
          >
            <Bell size={18} />
            {staffRequests.length > 0 && (
              <span className="cd-bell-badge">{staffRequests.length}</span>
            )}
          </button>
        </div>
        <div className="cd-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`cd-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff requests panel */}
      {showRequests && (
        <div className="cd-requests-panel">
          <div className="cd-requests-hdr">
            <span>Pedidos de Staff</span>
            <button className="cd-requests-close" onClick={() => setShowRequests(false)}><X size={16} /></button>
          </div>
          {staffRequests.length === 0 ? (
            <div className="cd-requests-empty">Sem pedidos pendentes.</div>
          ) : (
            staffRequests.map((r) => (
              <div key={r.id} className="cd-request-row">
                <div className="cd-request-info">
                  <span className="cd-request-spot">Chapéu {r.spot.spotNumber}</span>
                  <span className="cd-request-meta">
                    {r.clientName ?? "—"} · {new Date(r.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="cd-request-actions">
                  <button className="cd-req-btn attended" onClick={() => handleRequestAction(r.id, "ATTENDED")} title="Atendido">
                    <Check size={14} />
                  </button>
                  <button className="cd-req-btn dismissed" onClick={() => handleRequestAction(r.id, "DISMISSED")} title="Dispensar">
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="cd-body">
        {tab === "controlo" && <DailyControl concession={concession} />}
        {tab === "reservas" && <Reservations concession={concession} initialReservation={reservationInit} onInitHandled={() => setReservationInit(null)} />}
        {tab === "precario" && <PriceList concession={concession} />}
        {tab === "calculadora" && <CalcComponent concession={concession} onProceed={handleCalcProceed} />}
      </div>
    </div>
  );
}
