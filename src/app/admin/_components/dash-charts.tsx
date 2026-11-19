"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

/*
 * Tarjetas del resumen al estilo de los paneles de energía: vidrio oscuro con un
 * brillo arriba, un gráfico fino e interactivo como protagonista y dos números
 * grandes al pie. Al pasar el mouse (o tocar) se ilumina un dato y aparece su
 * globito; sin interacción queda iluminado el más importante.
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

/** Globito blanco con el valor, sobre el dato iluminado. */
function Pill({ children, x, y }: { children: ReactNode; x: string; y: string }) {
  return (
    <span
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-luz px-2 py-0.5 text-[0.66rem] font-bold tabular-nums text-noche shadow-[0_6px_18px_-6px_#000]"
      style={{ left: x, top: y }}
    >
      {children}
    </span>
  );
}

export type StemGroup = { label: string; items: { label: string; value: number; detail: string }[] };

/**
 * Palitos con un punto arriba, agrupados (una "montaña" por fecha) y unidos por
 * una línea de puntitos en el piso. Cada palito es una tanda de entradas y su
 * alto es cuánto se vendió de esa tanda.
 */
export function Stems({ groups }: { groups: StemGroup[] }) {
  // Posiciones: palitos de una fecha juntos, puntitos de separación entre fechas.
  const GAP = 3; // puntitos entre fechas
  const cols: ({ kind: "stem"; g: number; i: number; value: number } | { kind: "dot" })[] = [];
  groups.forEach((g, gi) => {
    if (gi > 0) for (let k = 0; k < GAP; k++) cols.push({ kind: "dot" });
    g.items.forEach((it, i) => cols.push({ kind: "stem", g: gi, i, value: it.value }));
  });
  const stems = cols.flatMap((c, x) => (c.kind === "stem" ? [{ ...c, x }] : []));
  const best = stems.reduce((a, s) => (s.value > a.value ? s : a), stems[0]);
  const [hover, setHover] = useState<number | null>(null);
  const lit = stems.find((s) => s.x === hover) ?? best;
  if (!stems.length) return <p className="text-sm text-tenue">Sin fechas próximas.</p>;

  const W = cols.length * 10;
  const H = 100;
  const xOf = (x: number) => x * 10 + 5;
  const yOf = (v: number) => H - 6 - v * (H - 22);
  const item = groups[lit.g].items[lit.i];

  return (
    <div className="relative w-full" onPointerLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-40 w-full overflow-visible"
        role="img"
        aria-label={stems.map((s) => groups[s.g].items[s.i].detail).join(". ")}
      >
        {cols.map((c, x) =>
          c.kind === "dot" ? (
            <circle key={x} cx={xOf(x)} cy={H - 4} r="1.1" fill="#ffffff26" vectorEffect="non-scaling-stroke" />
          ) : null,
        )}
        {stems.map((s) => {
          const on = s.x === lit.x;
          const sameGroup = s.g === lit.g;
          return (
            <g key={s.x} className="adm-stem" style={{ animationDelay: `${s.x * 18}ms` }}>
              <line
                x1={xOf(s.x)}
                x2={xOf(s.x)}
                y1={H - 4}
                y2={yOf(s.value)}
                stroke={on ? "#f6f6f6" : sameGroup ? "#ffffff70" : "#ffffff38"}
                strokeWidth={on ? 1.6 : 1.1}
                vectorEffect="non-scaling-stroke"
              />
              {/* Zona de toque más ancha que el palito. */}
              <rect x={xOf(s.x) - 5} y="0" width="10" height={H} fill="transparent" onPointerEnter={() => setHover(s.x)} onPointerDown={() => setHover(s.x)} />
            </g>
          );
        })}
      </svg>
      {/* Los puntos arriba de cada palito, en HTML para que queden redondos aunque el SVG se estire. */}
      {stems.map((s) => {
        const on = s.x === lit.x;
        return (
          <span
            key={s.x}
            className={`pointer-events-none absolute size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full ${on ? "bg-luz shadow-[0_0_10px_#fff]" : "bg-white/55"}`}
            style={{ left: `${(xOf(s.x) / W) * 100}%`, top: `${(yOf(s.value) / H) * 100}%` }}
            aria-hidden
          />
        );
      })}
      <Pill x={`${(xOf(lit.x) / W) * 100}%`} y={`calc(${(yOf(lit.value) / H) * 100}% - 8px)`}>
        {Math.round(item.value * 100)}%
      </Pill>
      {/* Etiquetas de cada fecha, centradas bajo su montaña. */}
      <div className="relative mt-2 h-4 text-[0.62rem] tabular-nums text-white/40">
        {groups.map((g, gi) => {
          const xs = stems.filter((s) => s.g === gi).map((s) => xOf(s.x));
          const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
          return (
            <span key={gi} className={`absolute -translate-x-1/2 whitespace-nowrap ${gi === lit.g ? "text-luz" : ""}`} style={{ left: `${(mid / W) * 100}%` }}>
              {g.label}
            </span>
          );
        })}
      </div>
      <p className="mt-1 truncate text-center text-[0.7rem] text-white/55" aria-live="polite">
        {item.detail}
      </p>
    </div>
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
  const bounds = parts.map((_, i) => {
    const from = parts.slice(0, i).reduce((a, p) => a + p.value, 0) / total;
    return [from, from + parts[i].value / total] as const;
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
 * Barras redondeadas, una por fecha: la parte llena es lo recaudado y la tenue,
 * lo que se puede recaudar si se vende todo. La iluminada muestra su monto.
 */
export function PillBars({
  items,
  format,
}: {
  items: { label: string; value: number; max: number }[];
  format: (v: number) => string;
}) {
  const top = Math.max(...items.map((i) => i.max), 1);
  const best = items.reduce((a, it, i) => (it.value > items[a].value ? i : a), 0);
  const [hover, setHover] = useState<number | null>(null);
  const lit = hover ?? best;
  if (!items.length) return <p className="text-sm text-tenue">Sin fechas próximas.</p>;
  return (
    <div className="w-full" onPointerLeave={() => setHover(null)}>
      <ol className="flex h-40 items-end gap-2.5" role="img" aria-label={items.map((i) => `${i.label}: ${format(i.value)} de ${format(i.max)}`).join(", ")}>
        {items.map((it, i) => {
          const on = i === lit;
          return (
            <li
              key={i}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onPointerEnter={() => setHover(i)}
              onPointerDown={() => setHover(i)}
            >
              {/* Lo que se puede recaudar, tenue. */}
              <span className="adm-barra relative block w-full max-w-9 overflow-hidden rounded-[0.6rem] bg-white/[0.06]" style={{ height: `${Math.max(8, (it.max / top) * 100)}%`, animationDelay: `${i * 50}ms` }}>
                {/* Lo recaudado, lleno. */}
                <span
                  className={`absolute inset-x-0 bottom-0 rounded-[0.6rem] transition-colors duration-200 ${on ? "bg-luz shadow-[0_0_18px_-2px_#fff9]" : "bg-white/20"}`}
                  style={{ height: `${it.max ? Math.max(6, (it.value / it.max) * 100) : 0}%` }}
                />
              </span>
              {on && (
                <Pill x="50%" y={`calc(${100 - (it.max / top) * 100 * (it.max ? it.value / it.max : 0)}% - 6px)`}>
                  {format(it.value)}
                </Pill>
              )}
            </li>
          );
        })}
      </ol>
      <ol className="mt-2 flex gap-2.5 text-center text-[0.62rem] tabular-nums text-white/40">
        {items.map((it, i) => (
          <li key={i} className={`flex-1 truncate ${i === lit ? "text-luz" : ""}`}>
            {it.label}
          </li>
        ))}
      </ol>
    </div>
  );
}

export { CIAN, MAGENTA };
