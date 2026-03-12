import React from "react";
import { Search, X } from "lucide-react";

interface DashboardSearchProps {
  search: string;
  setSearch: (s: string) => void;
}

export const DashboardSearch: React.FC<DashboardSearchProps> = ({ search, setSearch }) => {
  return (
    <div className="table-card-header">
      <h2>Reservas Recentes</h2>
      <div className="search-wrap">
        <Search size={16} className="search-icon" />
        <input 
          className="search-input" 
          placeholder="Pesquisar cliente, email ou atividade..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch("")}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
