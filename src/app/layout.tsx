import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-sw";
import { SITE } from "@/lib/site";
import "./globals.css";

// Archivo, pesada y un poco ancha, para títulos: geométrica como las letras del logo.
// Geist para el texto: neutra y muy legible en tamaños chicos.
const titulo = Archivo({ variable: "--font-titulo", subsets: ["latin"], axes: ["wdth"] });
const texto = Geist({ variable: "--font-texto", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: SITE.description,
  // Instalada en el iPhone: nombre, ícono y barra de estado sobre el fondo oscuro.
  appleWebApp: { capable: true, title: SITE.shortName, statusBarStyle: "black" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#05040a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${titulo.variable} ${texto.variable} h-full antialiased`}
      // El scroll suave (globals.css) es para los anclas; Next lo apaga al cambiar de página.
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
