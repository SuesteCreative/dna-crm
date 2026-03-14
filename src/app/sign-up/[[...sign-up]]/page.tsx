"use client";
import { SignUp } from "@clerk/nextjs";
import "../../auth.css";
import { clerkAppearance } from "../../clerkAppearance";

export default function Page() {
    return (
        <div className="auth-root">
            <img src="/SVG/logo-white.svg" alt="DNA" className="auth-logo" />
            <SignUp appearance={clerkAppearance} />
            <div className="auth-footer">
                <p className="auth-footer-warning">⚠️ Ferramenta interna. Se não é parceiro, não faça login.</p>
                <p className="auth-footer-copy">
                    © Desportos Náuticos de Alvor. Todos os direitos reservados.<br />
                    Desenvolvido por{" "}
                    <a href="https://sueste-creative.pt/" target="_blank" rel="noopener noreferrer">
                        Sueste — Creative Agency
                    </a>
                </p>
            </div>
        </div>
    );
}
