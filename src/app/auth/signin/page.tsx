"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("Credenciais inválidas. Tente novamente.");
            setLoading(false);
        } else {
            router.push("/");
        }
    };

    return (
        <div className="login-container">
            <div className="login-glass">
                <div className="logo-section">
                    <h1>DNA CRM</h1>
                    <p>Desportos Náuticos de Alvor</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Palavra-passe</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? "A entrar..." : "Entrar"}
                    </button>
                </form>
            </div>

            <style jsx global>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, #001f3f, #003366, #005588, #00aaff);
          font-family: 'Inter', sans-serif;
        }

        .login-glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 3rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .logo-section {
          text-align: center;
          margin-bottom: 2.5rem;
          color: white;
        }

        .logo-section h1 {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #ffffff 0%, #a0e9ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-section p {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-top: 0.5rem;
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-group label {
          display: block;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .input-group input {
          width: 100%;
          padding: 0.8rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .input-group input:focus {
          outline: none;
          border-color: #00aaff;
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 0 4px rgba(0, 170, 255, 0.1);
        }

        .input-group input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .error-message {
          color: #ff4d4d;
          font-size: 0.85rem;
          margin-top: -1rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        button {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #00aaff 0%, #0077ff 100%);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 119, 255, 0.3);
          margin-top: 1rem;
        }

        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 119, 255, 0.4);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
        </div>
    );
}
