"use client";

import { useEffect } from "react";
import { measureStops } from "./scroll-stops";

/*
 * Scroll libre que se acomoda, solo en pantallas táctiles: mientras se scrollea,
 * nada interviene. Cuando, después de soltar el dedo, la página se detiene entre
 * dos secciones (con una animación a medias), se desliza suave hasta una de ellas.
 *
 * Con ruedita o touchpad no actúa: ahí el scroll lo suaviza Lenis (smooth-scroll.tsx)
 * y acomodar en cada pausa de la ruedita se sentía como un freno.
 *
 * Respeta la dirección: si venías bajando y ya hiciste un cuarto del camino, sigue
 * hasta la siguiente; si no, vuelve a la anterior (y al revés subiendo). Cualquier
 * toque, ruedita o tecla durante el acomodo lo cancela.
 */

const DURATION = 450;
/** Cuánto del camino hacia la sección siguiente alcanza para que termine de llevarte. */
const COMMIT = 0.25;
/** Sin eventos de scroll durante este tiempo, se considera que la página se detuvo. */
const IDLE = 140;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function ScrollSettle() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lastY = window.scrollY;
    let dir = 0;
    let touching = false;
    // Solo se acomoda un scroll que empezó con el dedo; la ruedita lo desarma.
    let byTouch = false;
    let raf = 0;
    let settling = false;
    let timer = 0;

    const cancel = () => {
      if (!settling) return;
      cancelAnimationFrame(raf);
      settling = false;
    };

    const glide = (to: number) => {
      const from = window.scrollY;
      const start = performance.now();
      settling = true;
      const step = (now: number) => {
        if (!settling) return;
        const t = Math.min((now - start) / DURATION, 1);
        window.scrollTo({ top: from + (to - from) * easeOut(t), behavior: "instant" });
        if (t < 1) raf = requestAnimationFrame(step);
        else settling = false;
      };
      raf = requestAnimationFrame(step);
    };

    const settle = () => {
      if (!byTouch || touching || settling) return;
      const y = window.scrollY;
      const stops = measureStops();
      // ¿Entre qué dos secciones quedó?
      let i = -1;
      for (let k = 0; k < stops.length - 1; k++) {
        if (y > stops[k] + 2 && y < stops[k + 1] - 2) i = k;
      }
      if (i < 0) return;
      const a = stops[i];
      const b = stops[i + 1];
      const t = (y - a) / (b - a);
      const to = dir >= 0 ? (t > COMMIT ? b : a) : t < 1 - COMMIT ? a : b;
      glide(to);
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (!settling && Math.abs(y - lastY) > 0.5) dir = Math.sign(y - lastY);
      lastY = y;
      if (settling) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, IDLE);
    };

    // El usuario manda: si vuelve a tocar, girar la ruedita o usar el teclado, se cancela el acomodo.
    const onTouchStart = () => {
      touching = true;
      byTouch = true;
      cancel();
      window.clearTimeout(timer);
    };
    const onTouchEnd = () => {
      touching = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, IDLE);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    const onWheel = () => {
      byTouch = false;
      cancel();
      window.clearTimeout(timer);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", cancel);
    window.addEventListener("pointerdown", cancel);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", cancel);
      window.removeEventListener("pointerdown", cancel);
    };
  }, []);

  return null;
}
