"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, RefreshCw, ChevronLeft } from "lucide-react";
import "./scanner.css";

export default function ScannerPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const [isStarted, setIsStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [scanLock, setScanLock] = useState(false);

    const startScanner = async (mode: "environment" | "user") => {
        if (!scannerRef.current) return;
        setIsLoading(true);

        try {
            // First stop if already running
            if (isStarted) {
                await scannerRef.current.stop();
            }

            await scannerRef.current.start(
                { facingMode: mode },
                {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                onScanSuccess,
                onScanFailure
            );
            setIsStarted(true);
            setIsLoading(false);
        } catch (err) {
            console.error("Scanner error:", err);
            setError("Erro ao iniciar a câmara. Tente recarregar a página.");
            setIsLoading(false);
        }
    };

    useEffect(() => {
        scannerRef.current = new Html5Qrcode("reader");
        startScanner("environment");

        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    const toggleCamera = () => {
        const nextMode = facingMode === "environment" ? "user" : "environment";
        setFacingMode(nextMode);
        startScanner(nextMode);
    };

    function onScanSuccess(decodedText: string) {
        if (scanLock) return;

        try {
            // Check if it's a DNA CRM check-in URL
            if (decodedText.includes("/check-in/")) {
                setScanLock(true);
                const parts = decodedText.split("/check-in/");
                const id = parts[1].split(/[?&#]/)[0]; // Better ID extraction

                if (id) {
                    // Using window.location.href for a hard redirect 
                    // This is safer when dealing with camera hardware unmounting
                    if (scannerRef.current && scannerRef.current.isScanning) {
                        scannerRef.current.stop().finally(() => {
                            window.location.href = `/check-in/${id}`;
                        });
                    } else {
                        window.location.href = `/check-in/${id}`;
                    }
                } else {
                    setScanLock(false);
                }
            } else {
                setError("QR Code inválido. Certifique-se que está a ler um código DNA CRM.");
                setTimeout(() => setError(null), 3500);
            }
        } catch (err) {
            console.error("Scan processing error:", err);
            setScanLock(false);
        }
    }

    function onScanFailure(error: any) {
        // Just noise
    }

    return (
        <div className="scanner-container">
            <div className="scanner-header">
                <Camera size={24} className="header-icon" />
                <h1>Scanner de Check-in</h1>
                <p>Aponte a câmara para o QR Code da reserva</p>
            </div>

            <div className="scanner-main">
                <div className="scanner-wrapper">
                    <div id="reader" className={isLoading ? "loading" : ""}></div>
                    {isLoading && (
                        <div className="scanner-loader">
                            <RefreshCw className="spin" size={32} />
                            <span>A iniciar câmara...</span>
                        </div>
                    )}
                </div>

                <div className="scanner-actions">
                    <button className="btn-flip" onClick={toggleCamera} disabled={isLoading}>
                        <RefreshCw size={20} />
                        <span>Inverter para {facingMode === "environment" ? "Frontal" : "Traseira"}</span>
                    </button>
                    <p className="camera-status">Câmara {facingMode === "environment" ? "Traseira" : "Frontal"} Ativa</p>
                </div>
            </div>

            {error && (
                <div className="scanner-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <div className="scanner-instructions">
                <div className="step">
                    <span className="step-num">1</span>
                    <p>Posicione o QR Code no centro do quadrado</p>
                </div>
            </div>

            <button className="btn-back" onClick={() => router.push("/")}>
                <ChevronLeft size={18} />
                Voltar ao Dashboard
            </button>
        </div>
    );
}
