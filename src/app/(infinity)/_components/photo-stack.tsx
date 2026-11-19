"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/** Dónde cae cada foto respecto del centro de la pila (en % de su tamaño) y cuánto se inclina. */
const SPOTS: [number, number, number][] = [
  [0, 0, -2],
  [34, 10, 4],
  [-36, 8, -5],
  [16, -12, 2],
  [-18, -10, 6],
  [44, -6, -3],
  [-46, -4, 3],
  [8, 14, -2],
  [-6, 2, 1],
];

/**
 * Las fotos de la noche se van apilando con el scroll: cada tramo trae una
 * foto nueva que crece desde el centro y cae sobre las anteriores, que quedan
 * un poco más chicas y oscuras debajo.
 */
export function PhotoStack({
  photos,
  title,
  text,
  id,
}: {
  photos: string[];
  title: string;
  text: string;
  id?: string;
}) {
  const section = useRef<HTMLElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const n = photos.length;

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = 1;
    let shown = -1;
    let last = performance.now();
    let raf = 0;

    const read = () => {
      const r = el.getBoundingClientRect();
      const travel = Math.max(r.height - window.innerHeight, 1);
      const p = Math.min(Math.max(-r.top / travel, 0), 1);
      // La primera foto ya está; el resto entra a lo largo del scroll.
      target = 1 + p * (n - 1);
    };

    // El bucle sólo corre mientras las fotos se están acomodando; después se duerme hasta el próximo scroll.
    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const next = still || shown < 0 ? target : shown + (target - shown) * (1 - Math.exp(-dt * 7));
      if (Math.abs(next - shown) < 0.0005) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
      shown = next;
      items.current.forEach((item, i) => {
        if (!item) return;
        const enter = Math.min(Math.max(shown - i, 0), 1);
        // Entra con una curva que frena al llegar.
        const eased = 1 - Math.pow(1 - enter, 3);
        item.style.setProperty("--in", eased.toFixed(4));
        item.style.setProperty("--prof", Math.min(Math.max(shown - i - 1, 0), 5).toFixed(3));
      });
    };

    const wake = () => {
      read();
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    wake();
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", wake);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", wake);
    };
  }, [n]);

  return (
    <section ref={section} id={id} className="relative" style={{ height: `${100 + n * 40}svh` }}>
      <div className="sticky top-0 flex h-svh flex-col overflow-hidden pt-14 sm:flex-row sm:items-center">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:gap-10 sm:px-10">
          <div className="inf-revela sm:w-[38%]">
            {/* El hilo de neón (ver NeonThread) baja desde la tarjeta y envuelve este bloque. */}
            <div data-hilo="fotos" className="w-fit px-5 py-4 sm:px-7 sm:py-6">
              <h2 className="inf-titulo text-3xl text-balance sm:text-5xl">{title}</h2>
              <p className="mt-3 max-w-sm text-white/70 sm:text-lg">{text}</p>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <div className="inf-pila relative">
              {photos.map((src, i) => {
                const [x, y, r] = SPOTS[i % SPOTS.length];
                return (
                  <div
                    key={src}
                    ref={(node) => {
                      items.current[i] = node;
                    }}
                    className="inf-foto absolute inset-0 overflow-hidden rounded-2xl"
                    style={{ "--x": x, "--y": y, "--r": r, "--in": i === 0 ? 1 : 0, "--prof": 0, zIndex: i } as React.CSSProperties}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 22rem, 60vw"
                      className="object-cover"
                      draggable={false}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
