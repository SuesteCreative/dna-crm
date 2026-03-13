"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { TreePalm, Waves, ArrowLeft, LayoutGrid, CalendarDays, BookOpen, Calculator } from "lucide-react";
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

  const handleCalcProceed = (data: ReservationInitData) => {
    setReservationInit(data);
    setTab("reservas");
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAdmin) { router.push("/pending"); return; }
    fetch(`/api/concessions/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.push("/concessao"); return; }
        setConcession(data);
      });
  }, [isLoaded, isAdmin, params.slug]);

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

      <div className="cd-body">
        {tab === "controlo" && <DailyControl concession={concession} />}
        {tab === "reservas" && <Reservations concession={concession} initialReservation={reservationInit} onInitHandled={() => setReservationInit(null)} />}
        {tab === "precario" && <PriceList concession={concession} />}
        {tab === "calculadora" && <CalcComponent concession={concession} onProceed={handleCalcProceed} />}
      </div>
    </div>
  );
}
