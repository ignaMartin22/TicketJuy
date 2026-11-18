import { Bricolage_Grotesque, Unbounded } from "next/font/google";
import "./infinity.css";

// Marca Infinity Producciones: portada con su tipografía y paleta.

// Unbounded: ancha y redonda, de cartel de boliche. Bricolage: un texto con carácter que se lee bien chico.
const titulo = Unbounded({ variable: "--font-titulo", subsets: ["latin"] });
const texto = Bricolage_Grotesque({ variable: "--font-texto", subsets: ["latin"] });

export default function InfinityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`infinity ${titulo.variable} ${texto.variable} relative isolate flex flex-1 flex-col`}>
      {children}
    </div>
  );
}
