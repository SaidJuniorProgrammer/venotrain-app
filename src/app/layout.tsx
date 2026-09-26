import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VENOTRAIN | Simulador Clínico",
  description: "Entrenamiento progresivo en accesos venosos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-200 min-h-screen antialiased selection:bg-cyan-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}