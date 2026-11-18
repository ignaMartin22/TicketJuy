"use client";

import { useEffect, useState } from "react";

/*
 * El símbolo del infinito como dato, para el panel del dueño:
 * el anillo celeste se llena con las entradas vendidas y el magenta con la gente
 * que ya entró. Con la noche llena, el ∞ queda completo.
 * Las curvas son las mismas del logo (public/brand/infinity/infinity-mark.svg).
 */

const CIAN = "M239.9 47.36A23.6 23.6 0 1 0 263.09 84.47";
const MAGENTA = "M309.1 93.84A23.6 23.6 0 1 0 285.91 56.73";

const CAPACIDAD = 580;

export function NightRings() {
  const [vendidas, setVendidas] = useState(412);
  const [adentro, setAdentro] = useState(236);

  // Simulación de una noche en curso: entra gente y se siguen vendiendo entradas.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setVendidas((v) => (v < CAPACIDAD ? v + (Math.random() < 0.35 ? 1 : 0) : v));
      setAdentro((a) => (a < vendidas ? a + (Math.random() < 0.8 ? 1 : 0) : a));
    }, 700);
    return () => clearInterval(id);
  }, [vendidas]);

  const pv = (vendidas / CAPACIDAD) * 100;
  const pa = (adentro / CAPACIDAD) * 100;

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[var(--inf-superficie)] p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold">Noche de Luna Llena</p>
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--inf-magenta)]">
          <span className="inf-vivo size-2 rounded-full" aria-hidden />
          En vivo
        </p>
      </div>

      <svg viewBox="208 38 133 66" className="mt-4 w-full" role="img" aria-label={`${vendidas} vendidas, ${adentro} adentro, de ${CAPACIDAD}`}>
        <defs>
          <filter id="brillo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Pistas apagadas */}
        <path d={CIAN} fill="none" stroke="var(--inf-cian)" strokeOpacity="0.14" strokeWidth="12" />
        <path d={MAGENTA} fill="none" stroke="var(--inf-magenta)" strokeOpacity="0.14" strokeWidth="12" />
        {/* Progreso */}
        <path
          d={CIAN}
          pathLength={100}
          fill="none"
          stroke="var(--inf-cian)"
          strokeWidth="12"
          strokeDasharray={`${pv} 100`}
          filter="url(#brillo)"
          className="transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none"
        />
        <path
          d={MAGENTA}
          pathLength={100}
          fill="none"
          stroke="var(--inf-magenta)"
          strokeWidth="12"
          strokeDasharray={`${pa} 100`}
          filter="url(#brillo)"
          className="transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none"
        />
        {/* La N blanca del logo */}
        <path fill="#F6F6F6" d="M242.25 41.5h12.4v45h-12.4zM294.35 54.7h12.4v45h-12.4z" />
        <path fill="none" stroke="#F6F6F6" strokeWidth="12.6" d="M263.3 43.85C263.3 61.5 285.7 79.69 285.7 97.35" />
      </svg>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <dt className="text-xs text-[var(--inf-tenue)]">Vendidas</dt>
          <dd className="inf-titulo text-2xl tabular-nums text-[var(--inf-cian)]">{vendidas}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--inf-tenue)]">Adentro</dt>
          <dd className="inf-titulo text-2xl tabular-nums text-[var(--inf-magenta)]">{adentro}</dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--inf-tenue)]">Capacidad</dt>
          <dd className="inf-titulo text-2xl tabular-nums">{CAPACIDAD}</dd>
        </div>
      </dl>
    </div>
  );
}
