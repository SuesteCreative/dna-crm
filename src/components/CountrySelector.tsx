"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

export interface Country {
    name: string;
    code: string;
    prefix: string;
    flag: string;
}

export const COUNTRIES: Country[] = [
    // Europa (Todos)
    { name: "Albânia", code: "AL", prefix: "+355", flag: "🇦🇱" },
    { name: "Alemanha", code: "DE", prefix: "+49", flag: "🇩🇪" },
    { name: "Andorra", code: "AD", prefix: "+376", flag: "🇦🇩" },
    { name: "Áustria", code: "AT", prefix: "+43", flag: "🇦🇹" },
    { name: "Bélgica", code: "BE", prefix: "+32", flag: "🇧🇪" },
    { name: "Bielorrússia", code: "BY", prefix: "+375", flag: "🇧🇾" },
    { name: "Bósnia e Herzegovina", code: "BA", prefix: "+387", flag: "🇧🇦" },
    { name: "Bulgária", code: "BG", prefix: "+359", flag: "🇧🇬" },
    { name: "Chipre", code: "CY", prefix: "+357", flag: "🇨🇾" },
    { name: "Croácia", code: "HR", prefix: "+385", flag: "🇭🇷" },
    { name: "Dinamarca", code: "DK", prefix: "+45", flag: "🇩🇰" },
    { name: "Eslováquia", code: "SK", prefix: "+421", flag: "🇸🇰" },
    { name: "Eslovénia", code: "SI", prefix: "+386", flag: "🇸🇮" },
    { name: "Espanha", code: "ES", prefix: "+34", flag: "🇪🇸" },
    { name: "Estónia", code: "EE", prefix: "+372", flag: "🇪🇪" },
    { name: "Finlândia", code: "FI", prefix: "+358", flag: "🇫🇮" },
    { name: "França", code: "FR", prefix: "+33", flag: "🇫🇷" },
    { name: "Grécia", code: "GR", prefix: "+30", flag: "🇬🇷" },
    { name: "Holanda", code: "NL", prefix: "+31", flag: "🇳🇱" },
    { name: "Hungria", code: "HU", prefix: "+36", flag: "🇭🇺" },
    { name: "Irlanda", code: "IE", prefix: "+353", flag: "🇮🇪" },
    { name: "Islândia", code: "IS", prefix: "+354", flag: "🇮🇸" },
    { name: "Itália", code: "IT", prefix: "+39", flag: "🇮🇹" },
    { name: "Letónia", code: "LV", prefix: "+371", flag: "🇱🇻" },
    { name: "Liechtenstein", code: "LI", prefix: "+423", flag: "🇱🇮" },
    { name: "Lituânia", code: "LT", prefix: "+370", flag: "🇱🇹" },
    { name: "Luxemburgo", code: "LU", prefix: "+352", flag: "🇱🇺" },
    { name: "Malta", code: "MT", prefix: "+356", flag: "🇲🇹" },
    { name: "Moldávia", code: "MD", prefix: "+373", flag: "🇲🇩" },
    { name: "Mónaco", code: "MC", prefix: "+377", flag: "🇲🇨" },
    { name: "Montenegro", code: "ME", prefix: "+382", flag: "🇲🇪" },
    { name: "Noruega", code: "NO", prefix: "+47", flag: "🇳🇴" },
    { name: "Polónia", code: "PL", prefix: "+48", flag: "🇵🇱" },
    { name: "Portugal", code: "PT", prefix: "+351", flag: "🇵🇹" },
    { name: "Reino Unido", code: "GB", prefix: "+44", flag: "🇬🇧" },
    { name: "República Checa", code: "CZ", prefix: "+420", flag: "🇨🇿" },
    { name: "República da Macedónia", code: "MK", prefix: "+389", flag: "🇲🇰" },
    { name: "Roménia", code: "RO", prefix: "+40", flag: "🇷🇴" },
    { name: "Rússia", code: "RU", prefix: "+7", flag: "🇷🇺" },
    { name: "San Marino", code: "SM", prefix: "+378", flag: "🇸🇲" },
    { name: "Sérvia", code: "RS", prefix: "+381", flag: "🇷🇸" },
    { name: "Suécia", code: "SE", prefix: "+46", flag: "🇸🇪" },
    { name: "Suíça", code: "CH", prefix: "+41", flag: "🇨🇭" },
    { name: "Turquia", code: "TR", prefix: "+90", flag: "🇹🇷" },
    { name: "Ucrânia", code: "UA", prefix: "+380", flag: "🇺🇦" },

    // Fora da Europa (Principais)
    { name: "Estados Unidos", code: "US", prefix: "+1", flag: "🇺🇸" },
    { name: "Canadá", code: "CA", prefix: "+1", flag: "🇨🇦" },
    { name: "Austrália", code: "AU", prefix: "+61", flag: "🇦🇺" },
    { name: "China", code: "CN", prefix: "+86", flag: "🇨🇳" },
    { name: "Brasil", code: "BR", prefix: "+55", flag: "🇧🇷" },
    { name: "Angola", code: "AO", prefix: "+244", flag: "🇦🇴" },
    { name: "Moçambique", code: "MZ", prefix: "+258", flag: "🇲🇿" },
    { name: "Cabo Verde", code: "CV", prefix: "+238", flag: "🇨🇻" },
    { name: "Israel", code: "IL", prefix: "+972", flag: "🇮🇱" },
    { name: "Emirados Árabes", code: "AE", prefix: "+971", flag: "🇦🇪" },
    { name: "Japão", code: "JP", prefix: "+81", flag: "🇯🇵" },
    { name: "Nova Zelândia", code: "NZ", prefix: "+64", flag: "🇳🇿" },
].sort((a, b) => a.name.localeCompare(b.name));

const PRIORITY_CODES = ["PT", "ES", "FR", "DE", "GR", "GB"];

interface CountrySelectorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
}

export function CountrySelector({ value, onChange, label, placeholder }: CountrySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Detect country from manual prefix input
    const currentCountry = useMemo(() => {
        if (!value) return null;
        // Find exact match first (by prefix or code)
        const exact = COUNTRIES.find(c => c.prefix === value || c.code === value);
        if (exact) return exact;

        // If it's a prefix like "+351", try to find it
        if (value.startsWith("+")) {
            return COUNTRIES.find(c => c.prefix === value);
        }
        return null;
    }, [value]);

    const filtered = useMemo(() => {
        const s = search.toLowerCase();
        if (!s) return COUNTRIES;
        return COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(s) ||
            c.code.toLowerCase().includes(s) ||
            c.prefix.includes(s)
        );
    }, [search]);

    const prioritized = useMemo(() => {
        return PRIORITY_CODES.map(code => COUNTRIES.find(c => c.code === code)).filter(Boolean) as Country[];
    }, []);

    const handleSelect = (country: Country) => {
        onChange(country.code);
        setIsOpen(false);
        setSearch("");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);

        // If the input matches a country prefix exactly, we might want to "lock" it
        // but for now allow free typing.
    };

    return (
        <div className="country-selector-root" ref={dropdownRef}>
            {label && <label className="country-selector-label">{label}</label>}
            <div className={`country-selector-trigger ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <div className="country-trigger-content">
                    {currentCountry ? (
                        <>
                            <img 
                                src={`https://flagcdn.com/w40/${currentCountry.code.toLowerCase()}.png`} 
                                alt={currentCountry.name}
                                className="country-flag-img"
                            />
                            <span className="country-code-iso">{currentCountry.code}</span>
                        </>
                    ) : (
                        <span className="country-empty-flag">🌐</span>
                    )}
                    <input
                        type="text"
                        className="country-prefix-input"
                        value={value}
                        onChange={handleInputChange}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={placeholder || "+351"}
                    />
                </div>
                <ChevronDown size={14} className={`country-chevron ${isOpen ? 'rotated' : ''}`} />
            </div>

            {isOpen && (
                <div className="country-dropdown">
                    <div className="country-search-wrap">
                        <Search size={14} className="country-search-icon" />
                        <input
                            type="text"
                            className="country-search-input"
                            placeholder="Procurar país ou prefixo..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        {search && <X size={14} className="country-search-clear" onClick={() => setSearch("")} />}
                    </div>

                    <div className="country-list-scroll">
                        {!search && (
                            <>
                                <div className="country-list-section">Frequentes</div>
                                {prioritized.map(c => (
                                    <div
                                        key={`prio-${c.code}`}
                                        className={`country-item ${value === c.prefix ? 'selected' : ''}`}
                                        onClick={() => handleSelect(c)}
                                    >
                                        <img 
                                            src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} 
                                            alt={c.name}
                                            className="country-item-flag-img"
                                        />
                                        <span className="country-item-name">{c.name}</span>
                                        <span className="country-item-prefix">{c.prefix}</span>
                                        {value === c.prefix && <Check size={14} className="country-item-check" />}
                                    </div>
                                ))}
                                <div className="country-list-divider" />
                            </>
                        )}

                        <div className="country-list-section">Todos os Países</div>
                        {filtered.length > 0 ? filtered.map(c => (
                            <div
                                key={c.code}
                                className={`country-item ${value === c.prefix ? 'selected' : ''}`}
                                onClick={() => handleSelect(c)}
                            >
                                <img 
                                    src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} 
                                    alt={c.name}
                                    className="country-item-flag-img"
                                />
                                <span className="country-item-name">{c.name}</span>
                                <span className="country-item-prefix">{c.prefix}</span>
                                {value === c.prefix && <Check size={14} className="country-item-check" />}
                            </div>
                        )) : (
                            <div className="country-item-empty">Nenhum país encontrado</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function X({ size, className, onClick }: { size: number; className?: string; onClick?: () => void }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            onClick={onClick}
            style={{ cursor: 'pointer' }}
        >
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
        </svg>
    );
}
