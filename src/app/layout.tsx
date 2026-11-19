import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
import "./globals.css";

// Archivo, pesada y un poco ancha, para títulos: geométrica como las letras del logo.
// Geist para el texto: neutra y muy legible en tamaños chicos.
const titulo = Archivo({ variable: "--font-titulo", subsets: ["latin"], axes: ["wdth"] });
const texto = Geist({ variable: "--font-texto", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Infinity Producciones", template: "%s | Infinity Producciones" },
  description: "Las fechas de Infinity en San Salvador de Jujuy. Comprás en un minuto y te llega por WhatsApp.",
};

export const viewport: Viewport = {
  themeColor: "#05040a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${titulo.variable} ${texto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
