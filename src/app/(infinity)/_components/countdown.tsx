"use client";

import { useEffect, useState } from "react";

/** Cuenta regresiva hasta que abre la próxima fecha. Se actualiza cada segundo. */
export function Countdown({ iso }: { iso: string }) {
  // Hasta que carga en el navegador no se sabe la hora: se muestran guiones.
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setLeft(Math.max(new Date(iso).getTime() - Date.now(), 0));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [iso]);

  if (left === 0) return <p className="inf-titulo text-2xl sm:text-3xl">Es esta noche</p>;

  const s = Math.floor((left ?? 0) / 1000);
  const parts: [string, number][] = [
    ["días", Math.floor(s / 86400)],
    ["horas", Math.floor(s / 3600) % 24],
    ["min", Math.floor(s / 60) % 60],
    ["seg", s % 60],
  ];

  return (
    <dl className="flex gap-6 max-sm:justify-center sm:gap-7" aria-live="off">
      {parts.map(([label, value]) => (
        <div key={label} className="flex flex-col max-sm:items-center">
          <dd className="inf-titulo text-3xl tabular-nums sm:text-5xl">
            {left === null ? "--" : String(value).padStart(2, "0")}
          </dd>
          <dt className="mt-1 text-sm text-white/65">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
