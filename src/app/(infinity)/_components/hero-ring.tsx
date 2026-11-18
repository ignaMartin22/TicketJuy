"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EventRing, type RingEvent } from "./event-ring";

/*
 * Portada al estilo de la referencia (Synapse): el cartel de la marca sobre la
 * pista y la próxima fecha con las otras asomando detrás. Al scrollear, la
 * portada se va, el fondo se apaga, la tarjeta baja al centro y las otras se
 * abren a su alrededor en anillo. Después, cada tramo de scroll gira el anillo
 * a la fecha siguiente.
 *
 * El avance de la entrada (0 a 1) queda en la variable CSS --e del escenario;
 * todo lo demás (fondo, portada, tarjetas) se mueve con esa variable en CSS.
 */
export function HeroRing({
  events,
  backdrop,
  hero,
  background,
}: {
  events: RingEvent[];
  backdrop?: string;
  /** El contenido de la portada: cartel, eslogan y botón. */
  hero: ReactNode;
  /** El fondo de todo el escenario (el video de la pista). */
  background: ReactNode;
}) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = 0;
    let shown = -1;
    let last = performance.now();
    let raf = 0;

    const read = () => {
      const r = el.getBoundingClientRect();
      const travel = Math.max(r.height - window.innerHeight, 1);
      const p = Math.min(Math.max(-r.top / travel, 0), 1);
      // El primer tramo es la entrada; el resto, una fecha por tramo.
      target = Math.min(p / 0.3, 1);
      const rest = Math.max(p - 0.3, 0) / 0.7;
      setStep(Math.min(Math.floor(rest * events.length), events.length - 1));
    };

    // La entrada no salta con cada ruedita: se acerca al scroll de a poco y con
    // una curva que arranca y termina suave.
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const next = still || shown < 0 ? target : shown + (target - shown) * (1 - Math.exp(-dt * 6));
      if (Math.abs(next - shown) < 0.0005 && next === target) return;
      shown = Math.abs(next - target) < 0.001 ? target : next;
      const eased = shown * shown * (3 - 2 * shown);
      stage.current?.style.setProperty("--e", eased.toFixed(4));
      if (stage.current) stage.current.dataset.listo = shown >= 0.999 ? "si" : "no";
    };

    read();
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
  }, [events.length]);

  return (
    <section ref={section} className="relative" style={{ height: `${100 + events.length * 55}svh` }}>
      {/* Adonde lleva "Ver próximas fechas": el punto donde el anillo ya está armado. */}
      <span id="fechas-ancla" className="absolute" style={{ top: `${0.3 * events.length * 55}svh` }} aria-hidden />
      <div
        ref={stage}
        data-listo="no"
        className="inf-escena sticky top-0 isolate h-svh overflow-hidden"
        style={{ "--e": 0 } as React.CSSProperties}
      >
        {/* La pista sigue de fondo en todo el escenario: en la portada se ve, al llegar a las fechas se apaga y se desenfoca. */}
        <div className="inf-fondo absolute inset-0 -z-10">{background}</div>
        <div className="inf-fondo-sombra absolute inset-0 -z-10" aria-hidden />

        <div className="inf-portada absolute inset-0">{hero}</div>

        {/* Luz de escenario en el piso, debajo de las tarjetas. */}
        <div className="inf-piso pointer-events-none absolute inset-x-0 bottom-0 h-[45svh]" aria-hidden />

        <h2 className="inf-titulo-fechas inf-titulo absolute inset-x-0 top-[calc(4rem+3svh)] text-center text-2xl sm:text-3xl">
          Próximas fechas
        </h2>

        <div className="inf-anillo-lugar absolute inset-x-0 top-[calc(50%+2rem)] -translate-y-1/2">
          <EventRing events={events} backdrop={backdrop} step={step} />
        </div>
      </div>
    </section>
  );
}
