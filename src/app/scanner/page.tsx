"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Camera, RefreshCcw, AlertCircle } from "lucide-react";
import "./scanner.css";

export default function ScannerPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize scanner
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true
            },
            /* verbose= */ false
        );

        scannerRef.current.render(onScanSuccess, onScanFailure);

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    function onScanSuccess(decodedText: string) {
        // Look for the check-in ID in the URL
        try {
            if (decodedText.includes("/check-in/")) {
                const id = decodedText.split("/check-in/")[1];
                if (id) {
                    // Success! Redirect
                    if (scannerRef.current) {
                        scannerRef.current.clear().then(() => {
                            router.push(`/check-in/${id}`);
                        });
                    }
                }
            } else {
                setError("QR Code inválido. Certifique-se que está a ler um código DNA CRM.");
                setTimeout(() => setError(null), 3000);
            }
        } catch (err) {
            console.error("Scan processing error:", err);
        }
    }

    function onScanFailure(error: any) {
        // Ignore noise
    }

    return (
        <div className="scanner-container">
            <div className="scanner-header">
                <Camera size={24} className="header-icon" />
                <h1>Scanner de Check-in</h1>
                <p>Aponte a câmara para o QR Code da reserva</p>
            </div>

            <div className="scanner-wrapper">
                <div id="reader"></div>
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
                    <p>Peça ao cliente o QR Code enviado por email</p>
                </div>
                <div className="step">
                    <span className="step-num">2</span>
                    <p>Posicione o código no centro do quadrado</p>
                </div>
                <div className="step">
                    <span className="step-num">3</span>
                    <p>Será automaticamente redirecionado para o check-in</p>
                </div>
            </div>

            <button className="btn-back" onClick={() => router.push("/")}>
                Voltar ao Dashboard
            </button>
        </div>
    );
}
