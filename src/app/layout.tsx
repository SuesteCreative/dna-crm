import { ClerkProvider, SignedIn } from "@clerk/nextjs";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";

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
                    <SignedIn>
                        <Sidebar />
                    </SignedIn>
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
