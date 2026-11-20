"use client";

import { useLayoutEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";
import { prefersReducedMotion } from "@/lib/dust";

/**
 * Un precio que, al cambiar, corre los números hasta el nuevo valor en vez de
 * saltar. Los números que corren se escriben directo en un nodo que React no
 * toca (así no re-renderiza por cuadro); el valor real queda para el lector de pantalla.
 */
export function RollingPrice({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fromValue = shown.current;
    // Al aparecer, o sin animaciones, el número va directo.
    if (fromValue === null || fromValue === value || prefersReducedMotion()) {
      shown.current = value;
      el.textContent = formatPrice(value);
      return;
    }
    const start = performance.now();
    const duration = 520;
    let raf = requestAnimationFrame(function step(now) {
      const k = Math.min(1, (now - start) / duration);
      const e = 1 - (1 - k) ** 3;
      shown.current = Math.round(fromValue + (value - fromValue) * e);
      el.textContent = formatPrice(shown.current);
      if (k < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <>
      <span ref={ref} aria-hidden />
      <span className="sr-only">{formatPrice(value)}</span>
    </>
  );
}
