import { ClerkProvider } from "@clerk/nextjs";
import "./Dashboard.css";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";

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
        <ClerkProvider>
            <html lang="pt">
                <body className={inter.className}>
                    <ToastProvider>
                        <Sidebar />
                        {children}
                    </ToastProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
