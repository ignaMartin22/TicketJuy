import { Inter, Sora } from "next/font/google";
import "./infinity.css";

// Marca Infinity Producciones: portada con su tipografía y paleta.

const sora = Sora({ variable: "--font-sora", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export default function InfinityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`infinity ${sora.variable} ${inter.variable} flex flex-1 flex-col`}>
      {children}
    </div>
  );
}
