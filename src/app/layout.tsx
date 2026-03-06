import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CRM | Desportos Náuticos de Alvor",
    description: "Sistema de CRM e Reservas para Desportos Náuticos de Alvor",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Because we're in App Router, auth() handles the SSR context safely.
    // However, if we're rendering this layout context for pages, the middleware
    // should prevent unauthenticated access to protected routes anyway, so we just
    // conditionally display the sidebar based on auth state without redirecting.
    const { userId } = await auth();

    return (
        <ClerkProvider>
            <html lang="pt">
                <body className={inter.className}>
                    {userId && <Sidebar />}
                    {children}
                </body>
            </html>
        </ClerkProvider>
    );
}
