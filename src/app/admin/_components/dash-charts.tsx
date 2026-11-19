"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

/*
 * Tarjetas del resumen al estilo de los paneles de energía: vidrio oscuro con un
 * brillo arriba, un gráfico fino como protagonista y dos números grandes al pie.
 * Cada gráfico se lee sin pasar el mouse: los nombres y los números están escritos.
 * Los colores son los de la marca: blanco para lo destacado, celeste y magenta
 * para separar tipos de entrada.
 */

const CIAN = "#17b8f1";
const MAGENTA = "#ee10b8";

export function HelioCard({
  title,
  subtitle,
  badge,
  href,
  stats,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  /** Pastilla junto al subtítulo con el dato clave. */
  badge?: string;
  /** Adónde lleva la flechita de arriba a la derecha. */
  href?: string;
  /** Los dos números grandes del pie: [etiqueta, valor]. */
  stats: [string, string][];
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`adm-tarjeta relative flex flex-col overflow-hidden rounded-[1.4rem] border border-white/[0.07] p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[0.95rem] font-semibold leading-tight text-luz">{title}</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[0.95rem] leading-tight text-white/45">
            {subtitle}
            {badge && (
              <span className="rounded-md bg-[color-mix(in_oklab,var(--magenta)_16%,transparent)] px-1.5 py-0.5 text-[0.68rem] font-semibold tabular-nums text-[#ff7ad9]">
                {badge}
              </span>
            )}
          </p>
        </div>
        {href && (
          <Link
            href={href}
            aria-label={`Ver más: ${title}`}
            className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition-colors hover:text-luz"
          >
            <svg viewBox="0 0 16 16" className="size-3" aria-hidden>
              <path d="M5 11l6-6M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
      </header>

      <div className="flex min-h-48 flex-1 items-end py-4">{children}</div>

      <dl className="grid grid-cols-2 gap-4">
        {stats.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-white/40">{label}</dt>
            <dd className="mt-0.5 truncate text-[1.6rem] font-semibold leading-none tracking-tight tabular-nums text-luz">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export type RingPart = { label: string; value: number; color: string };

/**
 * Anillo de rayitas finas, cada sector de un color. Al pasar el mouse por un
 * sector (o por la leyenda) se ilumina y el centro muestra su porcentaje.
 */
export function SpokeRing({
  parts,
  center,
}: {
  parts: RingPart[];
  /** Lo que se muestra en el centro sin interacción: [etiqueta, valor]. */
  center: [string, string];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const N = 110;
  const spokes: { a: number; part: number }[] = [];
  // Dónde empieza y termina cada sector, en fracción de la vuelta.
  // Un sector con algo, aunque sea muy chico, ocupa al menos 3 rayitas para que se vea.
  const shares = parts.map((p) => (p.value > 0 ? Math.max(p.value / total, 3 / N) : 0));
  const sum = shares.reduce((a, s) => a + s, 0) || 1;
  const bounds = shares.map((_, i) => {
    const from = shares.slice(0, i).reduce((a, s) => a + s, 0) / sum;
    return [from, from + shares[i] / sum] as const;
  });
  for (let i = 0; i < N; i++) {
    const f = (i + 0.5) / N;
    const part = Math.max(0, bounds.findIndex(([a, b]) => f >= a && f < b));
    spokes.push({ a: f * Math.PI * 2 - Math.PI / 2, part });
  }
  const shown = hover !== null ? parts[hover] : null;

  /** Qué sector está bajo el puntero, según el ángulo. */
  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(x, y) / (r.width / 2);
    if (d < 0.55 || d > 1.05) return setHover(null);
    let f = (Math.atan2(y, x) + Math.PI / 2) / (Math.PI * 2);
    if (f < 0) f += 1;
    setHover(Math.max(0, bounds.findIndex(([a, b]) => f >= a && f < b)));
  };

  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative w-full max-w-[13rem]">
        <svg viewBox="0 0 200 200" className="block w-full" onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setHover(null)} role="img" aria-label={parts.map((p) => `${p.label}: ${Math.round((p.value / total) * 100)}%`).join(", ")}>
          {spokes.map((s, i) => {
            const on = hover === null ? parts[s.part].color !== "rest" : s.part === hover;
            const p = parts[s.part];
            // Largo con una ondulación suave, como el anillo de la referencia; más largo si está iluminado.
            const wave = 1 + 0.12 * Math.sin(i * 0.9) * Math.cos(i * 0.31);
            const inner = 66;
            const outer = inner + (on ? 26 : 16) * wave;
            const color = p.color === "rest" ? "#ffffff1f" : p.color;
            return (
              <line
                key={i}
                x1={100 + Math.cos(s.a) * inner}
                y1={100 + Math.sin(s.a) * inner}
                x2={100 + Math.cos(s.a) * outer}
                y2={100 + Math.sin(s.a) * outer}
                stroke={color}
                strokeOpacity={hover === null || s.part === hover ? 1 : 0.25}
                strokeWidth="1.6"
                strokeLinecap="round"
                className="adm-tick transition-[stroke-opacity] duration-200"
                style={{ animationDelay: `${i * 6}ms` }}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-white/45">{shown ? shown.label : center[0]}</p>
          <p className="mt-0.5 text-[2rem] font-semibold leading-none tabular-nums text-luz">
            {shown ? `${Math.round((shown.value / total) * 100)}%` : center[1]}
          </p>
        </div>
      </div>
      <ul className="mt-4 grid w-full grid-cols-2 gap-x-6 gap-y-1.5 text-[0.75rem]">
        {parts.map((p, i) => (
          <li
            key={p.label}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            className={`flex items-center gap-2 transition-opacity ${hover === null || hover === i ? "opacity-100" : "opacity-40"}`}
          >
            <span className="size-1.5 rounded-full" style={{ background: p.color === "rest" ? "#ffffff40" : p.color }} aria-hidden />
            <span className="text-white/60">{p.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-luz">{Math.round((p.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Una fila por fecha: el nombre, una barra de rayitas que se encienden hasta lo
 * vendido (celeste a magenta) y el número escrito. Se lee sin pasar el mouse.
 */
export function TickRows({
  rows,
}: {
  rows: { title: string; date: string; sold: number; capacity: number }[];
}) {
  const N = 36;
  if (!rows.length) return <p className="text-sm text-tenue">Sin fechas próximas.</p>;
  return (
    <ul className="flex w-full flex-col gap-3.5">
      {rows.map((r, ri) => {
        const frac = r.capacity ? r.sold / r.capacity : 0;
        const lit = Math.round(frac * N);
        return (
          <li key={r.title + r.date}>
            <div className="flex items-baseline justify-between gap-3 text-[0.8rem]">
              <p className="min-w-0 truncate">
                <span className="font-semibold text-luz">{r.title}</span>
                <span className="ml-1.5 text-white/40">{r.date}</span>
              </p>
              <p className="shrink-0 tabular-nums text-white/60">
                <span className="font-semibold text-luz">{r.sold.toLocaleString("es-AR")}</span>/{r.capacity.toLocaleString("es-AR")}
                <span className="ml-1.5 inline-block w-9 text-right font-semibold text-luz">{Math.round(frac * 100)}%</span>
              </p>
            </div>
            {/* La barra: N rayitas; las vendidas encendidas con el degradado de la marca. */}
            <div className="mt-1.5 flex h-4 gap-[3px]" aria-hidden>
              {Array.from({ length: N }, (_, i) => (
                <span
                  key={i}
                  className="adm-tick flex-1 rounded-full"
                  style={{
                    background: i < lit ? `color-mix(in oklch, ${CIAN}, ${MAGENTA} ${(i / (N - 1)) * 100}%)` : "#ffffff14",
                    animationDelay: `${ri * 60 + i * 12}ms`,
                  }}
                />
              ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Una fila por fecha: lo recaudado lleno, dentro de lo que se puede recaudar
 * vendiendo todo (tenue), con los dos montos escritos.
 */
export function MoneyRows({
  rows,
  format,
}: {
  rows: { title: string; value: number; max: number }[];
  format: (v: number) => string;
}) {
  const top = Math.max(...rows.map((r) => r.max), 1);
  if (!rows.length) return <p className="text-sm text-tenue">Sin fechas próximas.</p>;
  return (
    <div className="w-full">
      <p className="mb-3 flex gap-4 text-[0.7rem] text-white/50" aria-hidden>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-luz" />Recaudado</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm border border-white/25 bg-white/[0.06]" />Falta vender</span>
      </p>
      <ul className="flex flex-col gap-3.5">
        {rows.map((r, i) => (
          <li key={r.title}>
            <div className="flex items-baseline justify-between gap-3 text-[0.8rem]">
              <p className="min-w-0 truncate font-semibold text-luz">{r.title}</p>
              <p className="shrink-0 tabular-nums text-white/50">
                <span className="font-semibold text-luz">{format(r.value)}</span> de {format(r.max)}
              </p>
            </div>
            {/* El largo de la pista es el potencial de la fecha (comparado con la más grande). */}
            <div className="mt-1.5 h-2.5 rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/10" style={{ width: `${Math.max(12, (r.max / top) * 100)}%` }}>
              <div
                className="adm-barra-x h-full rounded-full bg-luz shadow-[0_0_14px_-3px_#fff]"
                style={{ width: `${r.max ? (r.value / r.max) * 100 : 0}%`, animationDelay: `${i * 70}ms` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { CIAN, MAGENTA };
