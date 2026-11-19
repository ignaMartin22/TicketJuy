"use client";

import { useEffect } from "react";

/*
 * Scroll por secciones en la portada: cada gesto (una ruedita, un deslizamiento
 * en el celu, una tecla) lleva al punto de descanso siguiente o anterior, y nunca
 * a la mitad de una animación (la entrada del cartel, el hilo de neón, la pila de
 * fotos).
 *
 * Los puntos de descanso los marcan los propios componentes:
 * - `.inf-snap`: un punto invisible; se frena con él arriba de la pantalla.
 * - `[data-snap="centro"]`: se frena con el elemento centrado.
 * - `[data-snap="fin"]`: el final de la página.
 *
 * El scroll nativo se reemplaza sólo en la portada (este componente vive ahí). La
 * barra de scroll y los enlaces a anclas siguen funcionando igual.
 */

/** Cuánto tarda en ir de un punto al siguiente. */
const DURATION = 1000;
/** Después de un gesto, cuánto tiempo sin eventos de rueda hace falta para aceptar otro (la inercia del trackpad no cuenta). */
const WHEEL_QUIET = 300;
/** Distancia mínima de un deslizamiento en el celu para cambiar de punto. */
const SWIPE = 40;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Lo que tapa la barra flotante de arriba: "centro" centra en el espacio libre debajo de ella. */
function navHeight() {
  const nav = document.querySelector<HTMLElement>("header.fixed");
  return nav ? nav.getBoundingClientRect().bottom : 0;
}

/** La posición de scroll de un punto de descanso. */
export function stopOf(el: HTMLElement) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const r = el.getBoundingClientRect();
  const top = r.top + window.scrollY;
  const nav = navHeight();
  const y =
    el.dataset.snap === "centro"
      ? // Centrado debajo de la barra, y nunca tan arriba que la barra lo tape.
        Math.min(top + r.height / 2 - (window.innerHeight + nav) / 2, top - nav - 16)
      : el.dataset.snap === "fin"
        ? max
        : top;
  return Math.round(Math.min(Math.max(y, 0), max));
}

/** Todos los puntos de descanso de la página, de arriba a abajo. */
export function measureStops() {
  const ys = [...new Set([...document.querySelectorAll<HTMLElement>(".inf-snap, [data-snap]")].map(stopOf))].sort((a, b) => a - b);
  // Dos paradas casi en el mismo lugar (por ejemplo Instagram y el pie en la compu) cuentan como una: se queda la
  // de más arriba, así lo importante (Instagram) queda entero y no debajo de la barra.
  return ys.filter((y, i) => i === 0 || y - ys[i - 1] > window.innerHeight * 0.25);
}

export function SectionScroll() {
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let stops: number[] = [];
    let raf = 0;
    let animating = false;
    let lastWheel = 0;
    let wheelLocked = false;

    const measure = () => {
      stops = measureStops();
    };

    /** El punto de descanso más cercano a donde está la página ahora. */
    const current = () => {
      let best = 0;
      for (let i = 1; i < stops.length; i++) {
        if (Math.abs(stops[i] - window.scrollY) < Math.abs(stops[best] - window.scrollY)) best = i;
      }
      return best;
    };

    const go = (index: number) => {
      const i = Math.min(Math.max(index, 0), stops.length - 1);
      const from = window.scrollY;
      const to = stops[i];
      cancelAnimationFrame(raf);
      if (still || Math.abs(to - from) < 2) {
        window.scrollTo({ top: to, behavior: "instant" });
        animating = false;
        return;
      }
      animating = true;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / DURATION, 1);
        window.scrollTo({ top: from + (to - from) * ease(t), behavior: "instant" });
        if (t < 1) raf = requestAnimationFrame(step);
        else animating = false;
      };
      raf = requestAnimationFrame(step);
    };

    const move = (dir: number) => {
      measure();
      // Si quedó entre dos puntos (por ejemplo, arrastrando la barra), el primer gesto completa hacia ese lado.
      const i = current();
      const y = window.scrollY;
      if (dir > 0 && stops[i] > y + 2) return go(i);
      if (dir < 0 && stops[i] < y - 2) return go(i);
      go(i + dir);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // zoom con el trackpad
      // Los gestos de costado son de los carruseles (fechas y fotos), no del scroll.
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      const quiet = now - lastWheel > WHEEL_QUIET;
      lastWheel = now;
      if (Math.abs(e.deltaY) < 4) return;
      // Un gesto por vez: se libera cuando terminó la animación y la rueda se quedó quieta un momento.
      if (wheelLocked && (animating || !quiet)) return;
      wheelLocked = true;
      move(Math.sign(e.deltaY));
    };

    let touch: { x: number; y: number } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch || e.touches.length > 1) return;
      const dx = e.touches[0].clientX - touch.x;
      const dy = e.touches[0].clientY - touch.y;
      // Sólo los deslizamientos verticales: los horizontales siguen arrastrando el anillo de fechas.
      // Si Chrome ya empezó a scrollear, el evento llega no cancelable
      // y el preventDefault solo genera un aviso en consola.
      if (Math.abs(dy) > Math.abs(dx) && e.cancelable) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touch) return;
      const dx = e.changedTouches[0].clientX - touch.x;
      const dy = e.changedTouches[0].clientY - touch.y;
      touch = null;
      if (Math.abs(dy) < SWIPE || Math.abs(dy) < Math.abs(dx)) return;
      move(dy < 0 ? 1 : -1);
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]") || e.altKey || e.ctrlKey || e.metaKey) return;
      const onPage = !t || t === document.body;
      const next = e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey && onPage);
      const prev = e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey && onPage);
      if (next || prev) {
        e.preventDefault();
        move(next ? 1 : -1);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        measure();
        go(e.key === "Home" ? 0 : stops.length - 1);
      }
    };

    // Cuando la rueda se queda quieta, se acepta el gesto siguiente.
    const unlock = window.setInterval(() => {
      if (!animating && performance.now() - lastWheel > WHEEL_QUIET) wheelLocked = false;
    }, 100);

    // Los links a una sección de la página (Fechas, Fotos) van directo, con el mismo deslizamiento.
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const target = a && document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      measure();
      const y = stopOf(target);
      let i = 0;
      for (let k = 1; k < stops.length; k++) if (Math.abs(stops[k] - y) < Math.abs(stops[i] - y)) i = k;
      go(i);
      history.replaceState(null, "", a.hash);
    };

    measure();
    document.addEventListener("click", onClick);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(unlock);
      document.removeEventListener("click", onClick);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return null;
}
