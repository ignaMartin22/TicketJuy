"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, type ReactNode } from "react";

export type RingEvent = {
  slug: string;
  href: string;
  title: string;
  lineup: string;
  /** "vie 20 nov", para lectores de pantalla. */
  date: string;
  /** Partes de la fecha para el bloque del afiche: "vie", "20", "nov". */
  weekday: string;
  day: string;
  month: string;
  /** "00:30" */
  time: string;
  /** Precio final más barato, ya formateado. null si está agotada. */
  from: string | null;
  /** Aviso solo cuando queda poco ("Últimas 29 · Anticipada"); null si no hace falta. */
  scarcity: string | null;
  /** Color de la luz de la tarjeta. */
  tone: string;
};

/**
 * Las fechas en un anillo 3D: la del medio encendida con su color, las de los
 * costados giradas y apagadas. Gira con el scroll (`step`, desde HeroRing),
 * con las flechas, con el teclado o arrastrando.
 */
export function EventRing({
  events,
  backdrop,
  step = 0,
  underCard,
}: {
  events: RingEvent[];
  backdrop?: string;
  step?: number;
  /** Va pegado debajo de la tarjeta mientras está en la portada. */
  underCard?: ReactNode;
}) {
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
        {underCard && <div className="inf-bajo-tarjeta">{underCard}</div>}
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
              onPointerMove={center ? tilt : undefined}
              onPointerLeave={center ? untilt : undefined}
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

/**
 * Con el mouse, la tarjeta del medio se inclina hacia el puntero y un brillo sigue la luz.
 * Se escribe el transform directo en la tarjeta (no variables CSS en el contenedor, que
 * recalcularían los estilos de todo su contenido en cada movimiento).
 */
function tilt(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const body = el.querySelector<HTMLElement>(".inf-tarjeta-cuerpo");
  const shine = el.querySelector<HTMLElement>(".inf-tarjeta-brillo");
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  if (body) body.style.transform = `perspective(900px) rotateX(${((0.5 - y) * 12).toFixed(2)}deg) rotateY(${((x - 0.5) * 16).toFixed(2)}deg)`;
  if (shine) {
    shine.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
    shine.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
  }
  el.dataset.inclinada = "";
}
function untilt(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.querySelector<HTMLElement>(".inf-tarjeta-cuerpo")?.style.removeProperty("transform");
  delete el.dataset.inclinada;
}

/**
 * La tarjeta es un flyer con talón de entrada: la fecha como en un afiche arriba,
 * el título abajo y, separado por el corte, el precio. No dice "en venta" (se
 * sobreentiende): solo avisa lo que cambia la decisión, que quedan pocas o que no quedan.
 */
function Card({ ev, backdrop }: { ev: RingEvent; backdrop?: string }) {
  const soldOut = !ev.from;
  return (
    <article className="inf-tarjeta-cuerpo @container relative isolate flex h-full flex-col overflow-hidden rounded-[inherit]">
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
      <div className="inf-tarjeta-brillo pointer-events-none absolute inset-0 z-10" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-gradient-to-t from-black/85 via-black/40 to-transparent" aria-hidden />

      <div className="inf-tarjeta-afiche flex flex-1 flex-col justify-between p-[7cqi]">
        <header className="flex items-start justify-between gap-3">
          <p className="inf-fecha-afiche flex flex-col items-start leading-none">
            <span className="text-[3.6cqi] font-semibold tracking-[0.22em] uppercase">{ev.weekday}</span>
            <span className="inf-titulo -ml-[0.04em] text-[19cqi] tabular-nums">{ev.day}</span>
            <span className="text-[3.6cqi] font-semibold tracking-[0.22em] uppercase">{ev.month}</span>
          </p>
          <p className="pt-[0.2em] text-[4cqi] font-semibold tabular-nums text-white/85">{ev.time} h</p>
        </header>

        <div>
          {ev.scarcity && !soldOut && (
            <p className="inf-fecha-afiche mb-[2.5cqi] text-[3.6cqi] font-bold tracking-[0.14em] text-white uppercase">
              {ev.scarcity}
            </p>
          )}
          <h3 className="inf-titulo text-[13cqi] uppercase leading-[0.95] text-balance">{ev.title}</h3>
          <p className="mt-[2.5cqi] line-clamp-1 text-[4.2cqi] text-white/80">{ev.lineup}</p>
        </div>
      </div>

      {/* El talón: el corte punteado entre los dos recortes, y el precio. */}
      <footer className="inf-talon flex items-center justify-between gap-3 px-[7cqi]">
        {soldOut ? (
          <p className="text-[4.4cqi] font-semibold text-white/70">Sin entradas</p>
        ) : (
          <p className="flex flex-col leading-tight">
            <span className="text-[3.2cqi] font-semibold tracking-[0.18em] text-white/60 uppercase">Desde</span>
            <span className="inf-titulo text-[7.5cqi] tabular-nums">{ev.from}</span>
          </p>
        )}
        {!soldOut && (
          <span
            className="grid size-[11cqi] shrink-0 place-items-center rounded-full bg-[var(--inf-luz)] text-[var(--inf-noche)]"
            aria-hidden
          >
            <svg viewBox="0 0 20 20" className="size-[45%]">
              <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </footer>

      {soldOut && (
        <p className="inf-sello inf-titulo pointer-events-none absolute left-1/2 top-[42%] text-[11cqi] uppercase" aria-hidden>
          Agotada
        </p>
      )}
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
