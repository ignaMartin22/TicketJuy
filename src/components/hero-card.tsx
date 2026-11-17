"use client";

import { useRef } from "react";

/**
 * Tarjeta de vidrio de la portada con un reflector que sigue al mouse.
 * En pantallas táctiles el reflector queda quieto en su lugar inicial.
 */
export function HeroCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div ref={ref} onPointerMove={onPointerMove} className={`vidrio ${className}`}>
      <div className="foco pointer-events-none absolute inset-0 rounded-[inherit]" aria-hidden />
      {children}
    </div>
  );
}
