import { SignIn } from "@clerk/nextjs";
import "../../auth.css";

const appearance = {
    variables: {
        colorBackground: "#111827",
        colorPrimary: "#3b82f6",
        colorText: "#f1f5f9",
        colorTextSecondary: "#64748b",
        colorInputBackground: "#1a2235",
        colorInputText: "#f1f5f9",
        colorNeutral: "#f1f5f9",
        borderRadius: "10px",
        fontFamily: "Inter, sans-serif",
    },
    elements: {
        card: { border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" },
        headerTitle: { color: "#f1f5f9" },
        headerSubtitle: { color: "#64748b" },
        formFieldInput: { borderColor: "rgba(255,255,255,0.07)" },
        footerActionLink: { color: "#3b82f6" },
        identityPreviewText: { color: "#f1f5f9" },
        identityPreviewEditButton: { color: "#3b82f6" },
    },
};

export default function Page() {
    return (
        <div className="auth-root">
            <img src="/SVG/logo-white.svg" alt="DNA" className="auth-logo" />
            <SignIn appearance={appearance} />
        </div>
    );
}
