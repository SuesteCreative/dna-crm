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
        <ClerkProvider appearance={{ variables: { colorText: "#ffffff", colorInputText: "#ffffff", colorBackground: "#1a1a2e", colorInputBackground: "#16213e" } }}>
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
