"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, AlertCircle, Clock, User, CreditCard, Activity } from "lucide-react";
import "./check-in.css";

export default function CheckInPage() {
    const params = useParams();
    const id = params.id as string;
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (id) {
            fetchBooking();
        }
    }, [id]);

    const fetchBooking = async () => {
        try {
            const res = await fetch(`/api/bookings/check-in?id=${id}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao carregar reserva.");
            }
            const data = await res.json();
            setBooking(data);
            if (data.showedUp) {
                setSuccess(true);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/bookings/attendance", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, showedUp: true }),
            });
            if (res.ok) {
                setSuccess(true);
                setBooking((prev: any) => ({ ...prev, showedUp: true }));
            } else {
                alert("Erro ao confirmar presença.");
            }
        } catch (err) {
            alert("Erro de ligação.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !booking) {
        return (
            <div className="checkin-container">
                <div className="loader" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="checkin-container">
                <div className="error-card">
                    <AlertCircle size={48} color="#ef4444" />
                    <h1>Reserva Não Encontrada</h1>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn-retry">Tentar Novamente</button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkin-container">
            <div className={`checkin-card ${success ? 'success-border' : ''}`}>
                <div className="card-header">
                    <div className="header-icon">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2>Check-in DNA</h2>
                        <p className="id-text">Referência: {booking.id}</p>
                    </div>
                </div>

                <div className="status-banner">
                    {success ? (
                        <div className="status-success">
                            <CheckCircle size={20} />
                            <span>Presença Confirmada</span>
                        </div>
                    ) : (
                        <div className="status-pending">
                            <Clock size={20} />
                            <span>Aguardando Check-in</span>
                        </div>
                    )}
                </div>

                <div className="info-section">
                    <div className="info-item">
                        <User size={18} className="info-icon" />
                        <div className="info-details">
                            <label>Cliente</label>
                            <p>{booking.customerName}</p>
                        </div>
                    </div>
                    <div className="info-item">
                        <Activity size={18} className="info-icon" />
                        <div className="info-details">
                            <label>Atividade</label>
                            <p>{booking.activityType || 'Reserva Esportiva'}</p>
                        </div>
                    </div>
                    <div className="info-row">
                        <div className="info-item">
                            <Clock size={18} className="info-icon" />
                            <div className="info-details">
                                <label>Horário</label>
                                <p>
                                    {booking?.activityDate ? new Date(booking.activityDate).toLocaleDateString("pt-PT") : '—'}<br />
                                    {booking?.activityTime || "A confirmar"}
                                </p>
                            </div>
                        </div>
                        <div className="info-item">
                            <User size={18} className="info-icon" />
                            <div className="info-details">
                                <label>Participantes</label>
                                <p>{booking.pax} PAX</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="payment-section">
                    <div className="info-item">
                        <CreditCard size={18} className="info-icon" />
                        <div className="info-details">
                            <label>Valor da Reserva</label>
                            <p className="price-text">{(booking?.totalPrice || 0).toFixed(2)}€</p>
                            <p className="source-text">Origem: {booking?.source || 'MANUAL'} {booking?.shopifyId ? `(Shopify: ${booking.shopifyId})` : ''}</p>
                        </div>
                    </div>
                </div>

                {booking.notes && (
                    <div className="notes-section">
                        <div className="info-details">
                            <label>Observações</label>
                            <p style={{ fontSize: '13px', color: '#94a3b8' }}>{booking.notes}</p>
                        </div>
                    </div>
                )}

                {!success && (
                    <button className="confirm-btn" onClick={handleConfirm} disabled={loading}>
                        {loading ? 'Processando...' : 'Confirmar Presença'}
                    </button>
                )}

                {success && (
                    <div className="success-msg">
                        Tudo pronto! O cliente já pode iniciar a atividade.
                    </div>
                )}
            </div>
        </div>
    );
}
