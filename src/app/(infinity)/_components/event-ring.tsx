"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";

export type RingEvent = {
  slug: string;
  href: string;
  title: string;
  lineup: string;
  /** "vie 20 nov" */
  date: string;
  /** "00:30" */
  time: string;
  /** Precio final más barato, ya formateado. null si está agotada. */
  from: string | null;
  /** Cuánto se vendió de cada tipo de entrada (0 a 1). */
  tiers: { id: string; sold: number }[];
  /** "Anticipada, 2ª tanda: quedan 29" */
  stock: string;
  /** Color de la luz de la tarjeta. */
  tone: string;
};

/**
 * Las fechas en un anillo 3D: la del medio encendida con su color, las de los
 * costados giradas y apagadas. Gira con el scroll (`step`, desde HeroRing),
 * con las flechas, con el teclado o arrastrando.
 */
export function EventRing({ events, backdrop, step = 0 }: { events: RingEvent[]; backdrop?: string; step?: number }) {
  const n = events.length;
  const [active, setActive] = useState(step);
  const [prevStep, setPrevStep] = useState(step);
  // Cuando el scroll pide otra fecha, el anillo gira hasta ella.
  if (step !== prevStep) {
    setPrevStep(step);
    setActive(((step % n) + n) % n);
  }
  const drag = useRef<{ x: number; id: number } | null>(null);
  // Si el gesto fue un arrastre, el clic que viene después no navega.
  const dragged = useRef(false);

  const go = useCallback((step: number) => setActive((a) => (a + step + n) % n), [n]);

  if (!n) return null;
  const current = events[active];
  const reach = n > 4 ? 2 : 1;

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Próximas fechas"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
    >
      <div
        className="inf-anillo relative mx-auto touch-pan-y select-none"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, id: e.pointerId };
          dragged.current = false;
        }}
        onClickCapture={(e) => {
          if (!dragged.current) return;
          e.preventDefault();
          e.stopPropagation();
          dragged.current = false;
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          if (Math.abs(dx) > 40) {
            dragged.current = true;
            go(dx < 0 ? 1 : -1);
          }
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        {events.map((ev, i) => {
          let o = i - active;
          if (o > n / 2) o -= n;
          if (o < -n / 2) o += n;
          const visible = Math.abs(o) <= reach;
          const center = o === 0;
          return (
            <div
              key={ev.slug}
              role="group"
              aria-roledescription="fecha"
              aria-label={`${i + 1} de ${n}: ${ev.title}`}
              aria-hidden={!visible}
              inert={!visible}
              data-centro={center || undefined}
              className="inf-tarjeta"
              style={{ "--o": o, "--abs": Math.abs(o), "--tono": ev.tone } as React.CSSProperties}
            >
              <Card ev={ev} backdrop={backdrop} />
              {center ? (
                <Link
                  href={ev.href}
                  className="absolute inset-0 rounded-[inherit]"
                  aria-label={`${ev.title}: comprar entradas`}
                  draggable={false}
                />
              ) : (
                <button
                  type="button"
                  className="absolute inset-0 rounded-[inherit]"
                  aria-label={`Mostrar ${ev.title}`}
                  onClick={() => setActive(i)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="inf-anillo-controles mt-6 flex flex-col items-center gap-4 sm:mt-8 sm:gap-5">
        <div className="flex items-center gap-3">
          <Arrow dir={-1} onClick={() => go(-1)} />
          <p className="min-w-[4.5rem] text-center text-sm tabular-nums text-[var(--inf-tenue)]">
            {active + 1} / {n}
          </p>
          <Arrow dir={1} onClick={() => go(1)} />
        </div>
        <Link
          href={current.href}
          className="inline-flex min-h-12 max-w-[calc(100vw-2rem)] items-center whitespace-nowrap rounded-full bg-[var(--inf-luz)] px-5 text-sm font-semibold sm:px-7 sm:text-base text-[var(--inf-noche)] transition-transform duration-200 ease-out active:scale-[0.97]"
        >
          {current.from ? `Comprar para ${current.title}` : `Ver ${current.title}`}
        </Link>
        <p className="sr-only" aria-live="polite">
          {current.title}, {current.date}
        </p>
      </div>
    </div>
  );
}

function Card({ ev, backdrop }: { ev: RingEvent; backdrop?: string }) {
  return (
    <article className="inf-tarjeta-cuerpo @container relative isolate flex h-full flex-col justify-between overflow-hidden rounded-[inherit] p-5 @max-[13rem]:p-3">
      {backdrop && (
        <Image
          src={backdrop}
          alt=""
          fill
          // Todas usan la misma foto; la del medio es lo primero que se ve.
          loading="eager"
          sizes="(min-width: 640px) 20rem, 72vw"
          className="inf-tarjeta-foto -z-30 object-cover"
          draggable={false}
        />
      )}
      <div className="inf-tarjeta-luz absolute inset-0 -z-20" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/80 to-transparent" aria-hidden />

      <header className="flex items-center justify-between gap-2 text-[4cqi] font-semibold">
        <span className="flex items-center gap-2 whitespace-nowrap rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-md">
          <span className={`size-1.5 rounded-full ${ev.from ? "inf-punto-vivo bg-[#9dff7a]" : "bg-white/50"}`} aria-hidden />
          {ev.from ? "En venta" : "Agotada"}
        </span>
        <span className="whitespace-nowrap rounded-full bg-black/40 px-3 py-1.5 capitalize tabular-nums backdrop-blur-md">{ev.date}</span>
      </header>

      <div>
        <h3 className="inf-titulo text-[13cqi] uppercase leading-[0.95] text-balance">{ev.title}</h3>
        <p className="mt-2 text-sm text-white/85 @max-[13rem]:hidden">{ev.lineup}</p>
        <div className="mt-4 flex gap-1.5 @max-[13rem]:mt-2" aria-hidden>
          {ev.tiers.map((t) => (
            <span key={t.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
              <span className="block h-full rounded-full bg-white" style={{ width: `${Math.round(t.sold * 100)}%` }} />
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs font-medium">{ev.stock}</p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/15 pt-3 text-sm @max-[13rem]:mt-2 @max-[13rem]:pt-2 @max-[13rem]:text-xs">
          <p className="text-white/85">
            {ev.from ? (
              <>
                desde <span className="text-base font-semibold text-white tabular-nums">{ev.from}</span>
              </>
            ) : (
              "Sin entradas"
            )}
          </p>
          <p className="tabular-nums text-white/85">{ev.time} h</p>
        </div>
      </div>
    </article>
  );
}

function Arrow({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 1 ? "Fecha siguiente" : "Fecha anterior"}
      className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/5 transition-[background-color,transform] duration-200 ease-out hover:bg-white/10 active:scale-[0.94]"
    >
      <svg viewBox="0 0 20 20" className={`size-4 ${dir === -1 ? "rotate-180" : ""}`} aria-hidden>
        <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
