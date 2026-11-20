"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

/*
 * Scroll suave de la portada con Lenis: la ruedita y el touchpad no saltan de a
 * tirones sino que la página se desliza y se detiene de a poco. En el celu Lenis
 * no interviene (el scroll con el dedo ya es suave y nativo). Con "reducir
 * movimiento" no se activa.
 *
 * Mueve el scroll de la ventana de verdad, así que todo lo que escucha "scroll"
 * (el anillo de fechas, el hilo de neón) sigue funcionando igual.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      // Cuánto se acerca a destino en cada cuadro: más bajo, más deslizado.
      lerp: 0.11,
      wheelMultiplier: 0.9,
      // Los links a #anclas (Fechas, Fotos) también se deslizan.
      anchors: true,
      autoRaf: true,
    });
    return () => lenis.destroy();
  }, []);

  return null;
}
