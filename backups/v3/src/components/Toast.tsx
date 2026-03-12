"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast-item ${toast.type}`}>
                        <div className="toast-icon">
                            {toast.type === "success" && <CheckCircle2 size={18} />}
                            {toast.type === "error" && <XCircle size={18} />}
                            {toast.type === "warning" && <AlertCircle size={18} />}
                            {toast.type === "info" && <Info size={18} />}
                        </div>
                        <div className="toast-message">{toast.message}</div>
                        <button className="toast-close" onClick={() => removeToast(toast.id)}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <style jsx global>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 350px;
          pointer-events: none;
        }

        .toast-item {
          pointer-events: auto;
          background: #1e1e30;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          animation: toast-slide-in 0.3s ease-out forwards;
        }

        .toast-message {
          color: #f1f1f1;
          font-size: 0.9rem;
          font-weight: 500;
          line-height: 1.4;
          flex: 1;
        }

        .toast-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 2px;
          display: flex;
          transition: color 0.15s;
        }

        .toast-close:hover {
          color: #fff;
        }

        .toast-item.success { border-left: 4px solid #22c55e; }
        .toast-item.error { border-left: 4px solid #ef4444; }
        .toast-item.warning { border-left: 4px solid #eab308; }
        .toast-item.info { border-left: 4px solid #3b82f6; }

        .toast-item.success .toast-icon { color: #22c55e; }
        .toast-item.error .toast-icon { color: #ef4444; }
        .toast-item.warning .toast-icon { color: #eab308; }
        .toast-item.info .toast-icon { color: #3b82f6; }

        @keyframes toast-slide-in {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
        </ToastContext.Provider>
    );
};
