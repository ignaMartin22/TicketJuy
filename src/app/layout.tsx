import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Unbounded } from "next/font/google";
import "./globals.css";

// Unbounded: ancha y redonda, de cartel de boliche. Bricolage: un texto con carácter que se lee bien chico.
const titulo = Unbounded({ variable: "--font-titulo", subsets: ["latin"] });
const texto = Bricolage_Grotesque({ variable: "--font-texto", subsets: ["latin"] });

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
