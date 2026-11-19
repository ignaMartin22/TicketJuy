"use client";

import { useEffect, useRef } from "react";
import { measureStops, stopOf } from "./scroll-stops";

/*
 * El hilo de neón de la página. Las dos líneas que salen del cartel y envuelven
 * la tarjeta (ver HeroRing) siguen bajando con el scroll: el marco se despega de
 * la tarjeta, cada línea baja por su borde de la pantalla y se cierran sobre lo
 * importante de la sección siguiente (las fotos), y de ahí sobre la invitación a
 * Instagram, donde terminan.
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

/** Separación mínima de las líneas respecto del borde de la pantalla mientras bajan. */
const EDGE = 10;
/** Cuánto por afuera del contenido bajan las líneas. */
const LANE = 36;

/**
 * Del centro de abajo de un marco al centro de arriba del siguiente, sin cruzar el
 * contenido: cada línea se abre hacia su lado (la celeste a la izquierda, la magenta
 * a la derecha), baja por afuera de las secciones y se cierra sobre la siguiente,
 * entrando desde arriba.
 */
function link(from: Rect, to: Rect, dir: number, vw: number) {
  const a = { x: (from.x0 + from.x1) / 2, y: from.y1 };
  const b = { x: (to.x0 + to.x1) / 2, y: to.y0 };
  // Bajan justo por afuera de las dos secciones (en el celu queda pegado al borde; en una
  // pantalla ancha no cruzan toda la pantalla).
  const x = dir < 0 ? Math.max(EDGE, Math.min(from.x0, to.x0) - LANE) : Math.min(vw - EDGE, Math.max(from.x1, to.x1) + LANE);
  // Dónde llega al borde y dónde lo deja; si las secciones están muy cerca, en el mismo punto.
  let y1 = a.y + 60;
  let y2 = b.y - 60;
  if (y2 < y1) y1 = y2 = (a.y + b.y) / 2;
  const e1 = { x, y: y1 };
  const e2 = { x, y: y2 };
  // Sale por el borde de abajo hacia su costado (sin cruzar los botones que van debajo, al
  // centro), baja por el carril y entra a la sección siguiente por arriba, también de costado.
  const out1 = { x: x + (a.x - x) * 0.35, y: a.y };
  const out2 = { x, y: a.y + Math.min(30, (y1 - a.y) * 0.5) };
  const in1 = { x, y: b.y - Math.min(30, (b.y - y2) * 0.5) };
  const in2 = { x: x + (b.x - x) * 0.35, y: b.y };
  return {
    d: ` C${out1.x} ${out1.y} ${out2.x} ${out2.y} ${e1.x} ${e1.y} L${e2.x} ${e2.y} C${in1.x} ${in1.y} ${in2.x} ${in2.y} ${b.x} ${b.y}`,
    len: cubicLen(a, out1, out2, e1) + (y2 - y1) + cubicLen(e2, in1, in2, b),
  };
}

/**
 * Los puntos del recorrido, en orden: [qué envuelve, separación, radio, el punto de
 * descanso del scroll donde queda envuelto]. El pase hacia cada uno ocupa todo el
 * tramo entre el punto de descanso anterior y el suyo.
 */
const STOPS: [string, number, number, string][] = [
  [".inf-tarjeta[data-centro]", 12, 36, ""],
  ['[data-hilo="fotos"]', 0, 26, "#fotos > .inf-snap"],
  ['[data-hilo="instagram"]', 10, 42, '[data-snap="centro"]'],
];

export function NeonThread() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const lines = [...el.querySelectorAll<SVGPathElement>("path")];

    /*
     * Las líneas viven en la página (no fijas en la pantalla): su forma se calcula una
     * vez en coordenadas de la página y el navegador las mueve junto con el contenido al
     * scrollear, sin ningún retraso. En cada cuadro sólo cambia qué tramo se ve.
     */
    type Pass = { from: number; to: number; parts: { fa: number; c: number; fb: number; total: number }[] };
    let passes: Pass[] = [];

    /** Dónde está un elemento en la página. La tarjeta del anillo se mide como queda en el punto de descanso de "Fechas". */
    const docRect = (sel: string, pad: number, r: number): Rect | null => {
      const node = document.querySelector<HTMLElement>(sel);
      if (!node) return null;
      const b = node.getBoundingClientRect();
      const origin = el.getBoundingClientRect();
      let dy = -origin.top;
      const stage = node.closest<HTMLElement>(".inf-escena");
      const anchor = document.getElementById("fechas-ancla");
      if (stage && anchor) {
        // La tarjeta vive en un escenario fijo en pantalla: en el punto de descanso, el escenario
        // está arriba de todo, así que en la página queda a esa altura.
        dy = -stage.getBoundingClientRect().top + stopOf(anchor) - (origin.top + window.scrollY);
      }
      return { x0: b.left - pad - origin.left, y0: b.top - pad + dy, x1: b.right + pad - origin.left, y1: b.bottom + pad + dy, r };
    };

    const build = () => {
      const rects = STOPS.map(([sel, pad, r]) => docRect(sel, pad, r));
      const stops = measureStops();
      const vw = el.clientWidth;
      el.setAttribute("viewBox", `0 0 ${vw} ${el.clientHeight}`);
      passes = [];
      for (let i = 0; i < rects.length - 1; i++) {
        const a = rects[i];
        const b = rects[i + 1];
        const mark = document.querySelector<HTMLElement>(STOPS[i + 1][3]);
        if (!a || !b || !mark) continue;
        const to = stopOf(mark);
        const from = stops.filter((s) => s < to - 2).at(-1) ?? 0;
        passes.push({ from, to, parts: [] });
      }
      // Un solo camino por línea con todos los marcos y uniones: tarjeta → fotos → Instagram.
      const pass = passes;
      lines.forEach((line, side) => {
        const dir = side === 0 ? -1 : 1;
        let d = "";
        let offset = 0;
        for (let i = 0; i < rects.length - 1; i++) {
          const a = rects[i]!;
          const b = rects[i + 1]!;
          if (!a || !b || !pass[i]) continue;
          const fa = frame(a, dir);
          const c = link(a, b, dir, vw);
          const fb = frame(b, dir);
          if (!d) d = `M${(a.x0 + a.x1) / 2} ${a.y0}${fa.d}`;
          // Un solo trazo continuo (la unión termina donde empieza el marco): el patrón del trazo
          // se reinicia en cada "M", así que no puede haber cortes en el camino.
          d += `${c.d}${fb.d}`;
          // Dónde empieza cada parte dentro del camino entero: marco de salida, unión, marco de llegada.
          pass[i].parts[side] = { fa: offset, c: offset + fa.len, fb: offset + fa.len + c.len, total: fb.len };
          offset += fa.len + c.len;
        }
        line.setAttribute("d", d);
        line.dataset.len = String(line.getTotalLength());
      });
      update();
    };

    const update = () => {
      // Cuánto avanzó cada pase: de 0 en el punto de descanso anterior a 1 en el suyo.
      let k = -1;
      let u = 0;
      passes.forEach((p, i) => {
        const t = Math.min(Math.max((window.scrollY - p.from) / Math.max(p.to - p.from, 1), 0), 1);
        if (t > 0) {
          k = i;
          u = t * t * (3 - 2 * t);
        }
      });
      // Mientras no empieza el primer pase, el marco de la tarjeta lo dibuja la portada.
      const hero = document.querySelector<SVGSVGElement>(".inf-lineas");
      if (hero) hero.style.visibility = k < 0 ? "visible" : "hidden";
      if (k < 0) {
        for (const l of lines) l.style.opacity = "0";
        return;
      }
      lines.forEach((line, side) => {
        const part = passes[k].parts[side];
        if (!part) return;
        const fa = part.c - part.fa;
        const c = part.fb - part.c;
        const fb = part.total;
        // En dos tiempos, como un hilo que se tira desde abajo: primero el marco de arriba
        // se desarma y sale por abajo mientras la línea baja; al llegar, el marco nuevo se
        // compone desde arriba.
        const first = Math.min(u * 2, 1);
        const second = Math.max(u * 2 - 1, 0);
        const tail = part.fa + first * fa + second * c;
        const head = part.fa + fa + first * c + second * fb;
        const len = Number(line.dataset.len) || 1e5;
        line.style.strokeDasharray = `0 ${tail.toFixed(1)} ${(head - tail).toFixed(1)} ${len.toFixed(0)}`;
        line.style.strokeDashoffset = "0";
        line.style.opacity = "1";
      });
    };

    // La forma se recalcula cuando cambia el alto de la página o de lo que envuelve
    // (cargan fuentes e imágenes, se acomoda algo de arriba). Se junta en un cuadro.
    let pending = 0;
    const schedule = () => {
      if (!pending) pending = requestAnimationFrame(() => {
        pending = 0;
        build();
      });
    };
    build();
    const ro = new ResizeObserver(schedule);
    if (el.parentElement) ro.observe(el.parentElement);
    for (const [sel] of STOPS) {
      const node = document.querySelector(sel);
      if (node) ro.observe(node);
    }
    document.fonts?.ready.then(schedule);
    window.addEventListener("load", schedule);
    // La tarjeta se mide cuando el anillo ya está armado (antes está en su lugar de la portada).
    const stage = document.querySelector(".inf-escena");
    const mo = new MutationObserver(() => {
      if ((stage as HTMLElement | null)?.dataset.listo === "si") build();
    });
    if (stage) mo.observe(stage, { attributes: true, attributeFilter: ["data-listo"] });
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(pending);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("load", schedule);
      window.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <svg ref={svg} className="pointer-events-none absolute inset-0 z-20 size-full overflow-visible" fill="none" aria-hidden>
      <path className="inf-linea inf-linea-cian" />
      <path className="inf-linea inf-linea-magenta" />
    </svg>
  );
}
