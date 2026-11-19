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
  underCard,
}: {
  events: RingEvent[];
  backdrop?: string;
  /** El contenido de la portada: cartel, eslogan y botón. */
  hero: ReactNode;
  /** El fondo de todo el escenario (el video de la pista). */
  background: ReactNode;
  /** Lo que va debajo de la tarjeta en la portada (la cuenta regresiva). Se va al armarse el anillo. */
  underCard?: ReactNode;
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
    let eased = 0;

    /** Posición de un elemento dentro del escenario, sin transformaciones (la portada se mueve con el scroll). */
    const offset = (node: HTMLElement) => {
      let x = 0;
      let y = 0;
      for (let e: HTMLElement | null = node; e && e !== stage.current; e = e.offsetParent as HTMLElement | null) {
        x += e.offsetLeft;
        y += e.offsetTop;
      }
      return { x, y };
    };

    /*
     * Los tubos del cartel que bajan y envuelven la tarjeta: uno celeste desde
     * INFI y uno magenta desde ITY. Cada uno baja hasta el borde de arriba de la
     * tarjeta y la rodea por su lado hasta encontrarse abajo. Con el scroll se
     * dibujan como una ventana que avanza: al final sólo queda el marco.
     */
    let lines: { el: SVGPathElement; len: number; frame: number }[] = [];
    const draw = (e: number) => {
      const p = Math.min(Math.max((e - 0.04) / 0.96, 0), 1);
      for (const l of lines) {
        const tail = p * (1 - l.frame);
        l.el.style.strokeDasharray = `${((p - tail) * l.len).toFixed(1)} ${(l.len * 2).toFixed(0)}`;
        l.el.style.strokeDashoffset = `${(-tail * l.len).toFixed(1)}`;
        l.el.style.opacity = p > 0 ? "1" : "0";
      }
    };
    const trace = () => {
      const s = stage.current;
      const svg = s?.querySelector<SVGSVGElement>(".inf-lineas");
      const sign = s?.querySelector<HTMLElement>("[data-cartel]");
      const card = s?.querySelector<HTMLElement>(".inf-tarjeta[data-centro]");
      const place = s?.querySelector<HTMLElement>(".inf-anillo-lugar");
      if (!s || !svg || !sign || !card || !place) return;
      svg.setAttribute("viewBox", `0 0 ${s.clientWidth} ${s.clientHeight}`);

      // Dónde termina la tarjeta del medio con el anillo armado (el lugar está corrido -50% en y).
      const c = offset(card);
      const pad = 12;
      const r = 24 + pad;
      const x0 = c.x - pad;
      const x1 = c.x + card.offsetWidth + pad;
      const y0 = c.y - place.offsetHeight / 2 - pad;
      const y1 = y0 + card.offsetHeight + pad * 2;
      const cx = (x0 + x1) / 2;
      const half = cx - x0 - r;
      const frameLen = half * 2 + Math.PI * r + (y1 - y0 - 2 * r);

      const o = offset(sign);
      // Salen del borde de las letras que mira hacia la tarjeta, para no cruzarlas:
      // por abajo si la tarjeta queda más abajo (celular), por arriba si queda más arriba (compu).
      const down = y0 > o.y + sign.offsetHeight / 2;
      const sy = o.y + sign.offsetHeight * (down ? 0.9 : 0.1);
      const lift = down ? 70 : -70;
      lines = [...svg.querySelectorAll<SVGPathElement>(".inf-linea")].map((el, k) => {
        const sx = o.x + sign.offsetWidth * (k === 0 ? 0.2 : 0.8);
        const dir = k === 0 ? -1 : 1;
        const xe = k === 0 ? x0 : x1;
        const sweep = k === 0 ? 0 : 1;
        el.setAttribute(
          "d",
          // Una curva suave: sale de la letra y entra al marco desde arriba, de su lado.
          `M${sx} ${sy} C${sx} ${sy + lift} ${cx + dir * 110} ${Math.max(y0 - 80, 8)} ${cx} ${y0}` +
            ` L${cx + dir * half} ${y0} A${r} ${r} 0 0 ${sweep} ${xe} ${y0 + r}` +
            ` L${xe} ${y1 - r} A${r} ${r} 0 0 ${sweep} ${cx + dir * half} ${y1} L${cx} ${y1}`,
        );
        const len = el.getTotalLength();
        return { el, len, frame: Math.min(frameLen / len, 1) };
      });
      draw(eased);
    };

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
      eased = shown * shown * (3 - 2 * shown);
      stage.current?.style.setProperty("--e", eased.toFixed(4));
      draw(eased);
      if (stage.current) stage.current.dataset.listo = shown >= 0.999 ? "si" : "no";
    };

    // En el celular la tarjeta de la portada va en el hueco entre el cartel y la
    // cuenta regresiva: se mide ese hueco y se ajustan tamaño (--hs) y altura (--hy)
    // para que no pise nada, sea cual sea el alto de la pantalla.
    const mobile = window.matchMedia("(max-width: 639px)");
    const fit = () => {
      const s = stage.current;
      const gap = s?.querySelector<HTMLElement>("[data-hueco]");
      const ring = s?.querySelector<HTMLElement>(".inf-anillo");
      const place = ring?.parentElement?.parentElement;
      if (!s || !gap || !ring || !place) return;
      if (!mobile.matches) {
        s.style.removeProperty("--hs");
        s.style.removeProperty("--hy");
        return;
      }
      // Posiciones sin transformaciones (la portada se mueve con el scroll y entra animada).
      const top = (el: HTMLElement) => {
        let y = 0;
        for (let e: HTMLElement | null = el; e && e !== s; e = e.offsetParent as HTMLElement | null) y += e.offsetTop;
        return y;
      };
      const ringCenter = top(place) - place.offsetHeight / 2 + ring.offsetTop + ring.offsetHeight / 2;
      // Lo que va montado en el borde de la tarjeta (la cuenta regresiva) asoma la mitad: también tiene que entrar.
      const under = s.querySelector<HTMLElement>(".inf-bajo-tarjeta");
      const underH = under ? under.offsetHeight * 0.75 + 8 : 0;
      // Margen para la inclinación y la sombra de la tarjeta.
      const scale = Math.min(Math.max((gap.offsetHeight - 44 - underH) / ring.offsetHeight, 0.4), 0.95);
      const cardH = ring.offsetHeight * scale;
      // La tarjeta y lo de abajo, juntos y centrados en el hueco.
      const groupTop = top(gap) + (gap.offsetHeight - cardH - underH) / 2;
      s.style.setProperty("--hs", scale.toFixed(3));
      s.style.setProperty("--hy", `${Math.round(groupTop + cardH / 2 - ringCenter)}px`);
    };

    const resize = () => {
      read();
      fit();
      trace();
    };

    read();
    fit();
    trace();
    raf = requestAnimationFrame(tick);
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", resize);
    // Las fuentes cambian el alto del texto cuando terminan de cargar.
    document.fonts?.ready.then(() => {
      fit();
      trace();
    });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", resize);
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

        {/* El título va junto al anillo, arriba de la tarjeta: así nunca se pisan, sea cual sea el alto de la pantalla. */}
        <div className="inf-anillo-lugar absolute inset-x-0 top-[calc(50%+1.75rem)] -translate-y-1/2">
          <h2 className="inf-titulo-fechas inf-titulo mb-4 text-center text-2xl sm:mb-6 sm:text-3xl">Próximas fechas</h2>
          <EventRing events={events} backdrop={backdrop} step={step} underCard={underCard} />
        </div>

        {/* Los tubos del cartel que bajan al scrollear y envuelven la tarjeta del medio. */}
        <svg className="inf-lineas pointer-events-none absolute inset-0 size-full" fill="none" aria-hidden>
          <path className="inf-linea inf-linea-cian" />
          <path className="inf-linea inf-linea-magenta" />
        </svg>
      </div>
    </section>
  );
}
