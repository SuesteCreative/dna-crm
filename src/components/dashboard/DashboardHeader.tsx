import React from "react";
import { Download, FileText, RefreshCcw, Calendar, Plus, CheckCircle, AlertCircle } from "lucide-react";

interface DashboardHeaderProps {
  isPartner: boolean;
  exportToExcel: () => void;
  exportToPDF: () => void;
  handleSync: () => void;
  syncing: boolean;
  handleGcalSync: () => void;
  gcalSyncing: boolean;
  setShowModal: (show: boolean) => void;
  setSlots: (slots: any[]) => void;
  setFormData: (data: any) => void;
  setCreateUnitPrice: (price: number | null) => void;
  defaultForm: any;
  syncMsg: string | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isPartner, exportToExcel, exportToPDF, handleSync, syncing, handleGcalSync, gcalSyncing, setShowModal, setSlots, setFormData, setCreateUnitPrice, defaultForm, syncMsg
}) => {
  return (
    <>
      <header className="crm-topbar">
        <div>
          <h1 className="page-title">Reservas</h1>
          <p className="page-sub">Gerencie todas as atividades e agendamentos.</p>
        </div>
        <div className="topbar-actions">
          {!isPartner && (
            <>
              <button className="btn-ghost" onClick={exportToExcel}><Download size={16} /> Excel</button>
              <button className="btn-ghost" onClick={exportToPDF}><FileText size={16} /> PDF</button>
              <button className={`btn-outline ${syncing ? "syncing" : ""}`} onClick={handleSync} disabled={syncing}>
                <RefreshCcw size={16} className={syncing ? "spin" : ""} />
                {syncing ? "Sincronizando..." : "Sync Shopify"}
              </button>
              <button className={`btn-outline ${gcalSyncing ? "syncing" : ""}`} onClick={handleGcalSync} disabled={gcalSyncing}>
                <Calendar size={16} className={gcalSyncing ? "spin" : ""} />
                {gcalSyncing ? "Sincronizando..." : "Sync GCal"}
              </button>
            </>
          )}
          <button className="btn-primary" onClick={() => { setShowModal(true); setSlots([]); setFormData(defaultForm); setCreateUnitPrice(null); }}>
            <Plus size={16} /> Nova Reserva
          </button>
        </div>
      </header>

      {syncMsg && (
        <div className={`sync-toast ${syncMsg.startsWith("Erro") ? "error" : "success"}`}>
          {syncMsg.startsWith("Erro") ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          {syncMsg}
        </div>
      )}
    </>
  );
};
