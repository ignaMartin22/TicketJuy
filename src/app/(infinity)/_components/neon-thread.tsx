"use client";

import { useEffect, useRef } from "react";

/*
 * El hilo de neón de la página. Las dos líneas que salen del cartel y envuelven
 * la tarjeta (ver HeroRing) siguen bajando con el scroll: el marco se despega de
 * la tarjeta, baja y envuelve lo importante de la sección siguiente (las fotos),
 * y de ahí la invitación a Instagram, donde terminan.
 *
 * Es una capa fija sobre la pantalla: en cada cuadro se miden los elementos
 * (marcados con data-hilo) y se arma el camino por ellos. Lo que se ve es una
 * ventana que avanza por ese camino: al empezar el pase, el marco completo del
 * anterior; en la primera mitad ese marco se desarma y sale por abajo; en el medio,
 * sólo las líneas partidas en tiritas que bajan; en la segunda mitad el marco
 * siguiente se compone desde arriba.
 */

type Rect = { x0: number; y0: number; x1: number; y1: number; r: number };
type Pt = { x: number; y: number };

/** Mitad del marco de un lado: del centro de arriba, por su costado, al centro de abajo. */
function frame(b: Rect, dir: number) {
  const cx = (b.x0 + b.x1) / 2;
  const r = Math.min(b.r, (b.y1 - b.y0) / 2, (b.x1 - b.x0) / 2);
  const half = cx - b.x0 - r;
  const xe = dir < 0 ? b.x0 : b.x1;
  const sweep = dir < 0 ? 0 : 1;
  const d =
    ` L${cx + dir * half} ${b.y0} A${r} ${r} 0 0 ${sweep} ${xe} ${b.y0 + r}` +
    ` L${xe} ${b.y1 - r} A${r} ${r} 0 0 ${sweep} ${cx + dir * half} ${b.y1} L${cx} ${b.y1}`;
  const len = half * 2 + Math.PI * r + (b.y1 - b.y0 - 2 * r);
  return { d, len };
}

/** Largo de una curva cúbica, midiendo tramos rectos. */
function cubicLen(a: Pt, c1: Pt, c2: Pt, b: Pt) {
  let len = 0;
  let prev = a;
  for (let i = 1; i <= 16; i++) {
    const t = i / 16;
    const u = 1 - t;
    const p = {
      x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
    };
    len += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return len;
}

/** Del centro de abajo de un marco al centro de arriba del siguiente, abriéndose un poco de su lado. */
function link(from: Rect, to: Rect, dir: number) {
  const a = { x: (from.x0 + from.x1) / 2, y: from.y1 };
  const b = { x: (to.x0 + to.x1) / 2, y: to.y0 };
  const dy = Math.max(b.y - a.y, 40);
  const c1 = { x: a.x + dir * 70, y: a.y + dy * 0.45 };
  const c2 = { x: b.x + dir * 70, y: b.y - dy * 0.45 };
  return { d: ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${b.x} ${b.y}`, len: cubicLen(a, c1, c2, b) };
}

/** Los puntos del recorrido, en orden: [selector, separación, radio]. */
const STOPS: [string, number, number][] = [
  [".inf-tarjeta[data-centro]", 12, 36],
  ['[data-hilo="fotos"]', 0, 26],
  ['[data-hilo="instagram"]', 10, 42],
];

export function NeonThread() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const lines = [...el.querySelectorAll<SVGPathElement>("path")];
    let raf = 0;
    let lastKey = "";

    const rectOf = (sel: string, pad: number, r: number): Rect | null => {
      const node = document.querySelector<HTMLElement>(sel);
      if (!node) return null;
      const b = node.getBoundingClientRect();
      return { x0: b.left - pad, y0: b.top - pad, x1: b.right + pad, y1: b.bottom + pad, r };
    };

    // Sólo se recalcula mientras algo se mueve: al scrollear, y un rato después
    // (la tarjeta de la portada termina de acomodarse con una curva suave).
    let until = 0;
    const tick = () => {
      if (performance.now() < until) raf = requestAnimationFrame(tick);
      else raf = 0;
      const vh = window.innerHeight;
      const rects = STOPS.map(([sel, pad, r]) => rectOf(sel, pad, r));
      // Cuánto avanzó cada pase: arranca cuando el siguiente asoma abajo y termina cuando llega a su lugar.
      let k = -1;
      let u = 0;
      for (let i = 0; i < rects.length - 1; i++) {
        const next = rects[i + 1];
        if (!rects[i] || !next) continue;
        // Empieza apenas lo de arriba se empieza a ir, así el marco no sube pegado a la tarjeta.
        const p = Math.min(Math.max((vh * 1.25 - next.y0) / (vh * 0.85), 0), 1);
        if (p > 0) {
          k = i;
          u = p * p * (3 - 2 * p);
        }
      }

      // Mientras no empieza el primer pase, el marco de la tarjeta lo dibuja la portada.
      const hero = document.querySelector<SVGSVGElement>(".inf-lineas");
      if (hero) hero.style.visibility = k < 0 ? "visible" : "hidden";

      const key = k < 0 ? "off" : `${k}:${u.toFixed(4)}:${rects.map((r) => (r ? `${r.x0|0},${r.y0|0},${r.x1|0},${r.y1|0}` : "-")).join("|")}`;
      if (key === lastKey) return;
      lastKey = key;
      if (k < 0) {
        for (const l of lines) l.style.opacity = "0";
        return;
      }

      const a = rects[k]!;
      const b = rects[k + 1]!;
      lines.forEach((line, side) => {
        const dir = side === 0 ? -1 : 1;
        const fa = frame(a, dir);
        const c = link(a, b, dir);
        const fb = frame(b, dir);
        line.setAttribute("d", `M${(a.x0 + a.x1) / 2} ${a.y0}${fa.d}${c.d}${fb.d}`);
        const total = fa.len + c.len + fb.len;
        // En dos tiempos, como un hilo que se tira desde abajo:
        // 1) el marco de arriba se desarma y sale por abajo mientras las líneas bajan
        //    (el de destino todavía no se toca, así no parece marcado de antemano);
        // 2) al llegar, el marco nuevo se compone desde arriba: entra por el centro de
        //    arriba, baja por los costados y se cierra abajo.
        const first = Math.min(u * 2, 1);
        const second = Math.max(u * 2 - 1, 0);
        const tail = first * fa.len + second * c.len;
        const head = fa.len + first * c.len + second * fb.len;
        // Mientras viaja, el tubo se parte en tiritas que se vuelven a juntar al llegar.
        const strips = 9;
        const cut = 0.55 * Math.sin(Math.PI * u);
        const piece = (head - tail) / strips;
        const pattern = Array.from({ length: strips }, () => `${(piece * (1 - cut)).toFixed(1)} ${(piece * cut).toFixed(1)}`);
        line.style.strokeDasharray = `${pattern.join(" ")} ${(total + 10).toFixed(0)}`;
        line.style.strokeDashoffset = `${(-tail).toFixed(1)}`;
        line.style.opacity = "1";
      });
    };

    const wake = () => {
      until = performance.now() + 1500;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
    };
  }, []);

  return (
    <svg ref={svg} className="pointer-events-none fixed inset-0 z-20 size-full" fill="none" aria-hidden>
      <path className="inf-linea inf-linea-cian" />
      <path className="inf-linea inf-linea-magenta" />
    </svg>
  );
}
