import "./infinity.css";

// Marca Infinity Producciones: portada con su tipografía y paleta.

// Las tipografías (Unbounded y Bricolage) se cargan en el layout raíz.

export default function InfinityLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="infinity relative isolate flex flex-1 flex-col">
      {children}
    </div>
  );
}
