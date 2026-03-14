import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "./Dashboard.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { StaffRequestProvider } from "@/contexts/StaffRequestContext";
import { StaffBanner } from "@/components/StaffBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CRM | Desportos Náuticos de Alvor",
    description: "Sistema de CRM e Reservas para Desportos Náuticos de Alvor",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider appearance={{
            variables: {
                colorText: "#ffffff",
                colorInputText: "#ffffff",
                colorBackground: "#1a1a2e",
                colorInputBackground: "#16213e",
                colorTextSecondary: "#a0a0b0",
            },
            elements: {
                // UserButton popup
                userButtonPopoverCard: { background: "#1e1e2e", border: "1px solid #333" },
                userButtonPopoverActionButton: { color: "#ffffff" },
                userButtonPopoverActionButtonText: { color: "#ffffff" },
                userButtonPopoverFooter: { display: "none" },
                userPreviewMainIdentifier: { color: "#ffffff" },
                userPreviewSecondaryIdentifier: { color: "#a0a0b0" },
                // UserProfile modal
                card: { background: "#1e1e2e", border: "1px solid #2d2d3d" },
                navbar: { background: "#16162a", borderRight: "1px solid #2d2d3d" },
                navbarButton: { color: "#e2e8f0" },
                navbarButtonIcon: { color: "#94a3b8" },
                pageScrollBox: { background: "#1e1e2e" },
                headerTitle: { color: "#f1f5f9" },
                headerSubtitle: { color: "#94a3b8" },
                profileSectionTitle: { color: "#f1f5f9", borderBottom: "1px solid #2d2d3d" },
                profileSectionTitleText: { color: "#f1f5f9" },
                profileSectionContent: { color: "#e2e8f0" },
                profileSectionPrimaryButton: { color: "#3b82f6" },
                formFieldLabel: { color: "#e2e8f0" },
                formFieldInput: { background: "#16213e", borderColor: "#2d2d3d", color: "#f1f5f9" },
                formFieldHintText: { color: "#94a3b8" },
                formFieldErrorText: { color: "#f87171" },
                formButtonPrimary: { background: "#3b82f6" },
                badge: { color: "#f1f5f9", background: "rgba(59,130,246,0.2)" },
                avatarBox: { border: "2px solid #2d2d3d" },
                userPreviewTextContainer: { color: "#f1f5f9" },
                accordionTriggerButton: { color: "#e2e8f0" },
            },
        }}>
            <html lang="pt">
                <body className={inter.className}>
                    <ToastProvider>
                        <StaffRequestProvider>
                            <Sidebar />
                            <StaffBanner />
                            {children}
                        </StaffRequestProvider>
                    </ToastProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
