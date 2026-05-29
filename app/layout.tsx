import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel de Gerenciamento",
  description: "Controle financeiro e contratos pessoais",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-background text-slate-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
