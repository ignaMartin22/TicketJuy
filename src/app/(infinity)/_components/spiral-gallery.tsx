"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/*
 * Galería en espiral: las fotos están sobre una hélice. La actual queda adelante,
 * grande y nítida; las que van pasando giran por el espiral hacia atrás (y hacia
 * arriba o abajo), más chicas y oscuras. Se navega arrastrando de costado (dedo,
 * mouse o trackpad) o con las flechas.
 *
 * Rendimiento: cada foto se mueve sólo con transform y opacity (se compone en la
 * GPU) escritos directo en su elemento, y el bucle corre sólo mientras gira.
 */

/** Cuánto gira el espiral entre una foto y la siguiente. */
const TURN = 0.58; // radianes
/** Cuánto sube o baja cada vuelta, en % del alto de una foto. */
const RISE = 0.34;
/** Hasta cuántas fotos de cada lado se ven. */
const REACH = 3.2;

export function SpiralGallery({ photos, className = "" }: { photos: string[]; className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const shades = useRef<(HTMLDivElement | null)[]>([]);
  const api = useRef<{ go: (dir: number) => void } | null>(null);
  const [current, setCurrent] = useState(0);
  const n = photos.length;

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let offset = 0;
    let target = 0;
    let vel = 0;
    let dragging = false;
    let raf = 0;
    let prev = performance.now();
    let shown = 0;

    /** Coloca cada foto en el espiral según su distancia a la actual. */
    const place = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      // En el celu (zona angosta) las fotos son grandes: el espiral se abre menos para que las de al lado asomen.
      const radius = w * (w < 500 ? 0.46 : 0.56);
      for (let i = 0; i < n; i++) {
        const item = items.current[i];
        if (!item) continue;
        // Distancia a la foto actual, por el camino más corto (el espiral da la vuelta).
        let rel = i - offset;
        rel -= Math.round(rel / n) * n;
        const a = rel * TURN;
        const x = Math.sin(a) * radius;
        const z = (Math.cos(a) - 1) * radius - Math.abs(rel) * 60;
        // Sube hacia la izquierda y baja hacia la derecha: la hélice se lee en diagonal.
        const y = -rel * RISE * h * 0.42;
        const far = Math.min(Math.abs(rel) / REACH, 1);
        // Cada foto con su propia perspectiva: así el orden de adelante/atrás lo decide z-index
        // (la distancia a la actual) y las de al lado nunca se cruzan con la de adelante.
        item.style.transform = `perspective(1100px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${((a * 180) / Math.PI).toFixed(2)}deg)`;
        item.style.opacity = String(Math.abs(rel) > REACH + 0.5 ? 0 : 1 - Math.max(Math.abs(rel) - REACH + 0.5, 0) * 2);
        item.style.zIndex = String(100 - Math.round(Math.abs(rel) * 10));
        // Las de atrás, más oscuras: una capa negra encima (opacity se compone, no repinta la foto).
        const shade = shades.current[i];
        if (shade) shade.style.opacity = (far * 0.75).toFixed(3);
        item.inert = Math.abs(rel) > 0.5;
      }
    };

    const frame = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      if (!dragging) {
        const next = still ? target : offset + (target - offset) * (1 - Math.exp(-dt * 8));
        vel = (next - offset) / Math.max(dt, 1e-3);
        offset = next;
      }
      place();
      const idx = ((Math.round(target) % n) + n) % n;
      if (idx !== shown) {
        shown = idx;
        setCurrent(idx);
      }
      const moving = dragging || Math.abs(target - offset) > 0.0008;
      if (moving) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        offset = target;
        place();
      }
    };
    const wake = () => {
      if (raf) return;
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    };
    api.current = {
      go: (dir) => {
        target = Math.round(target) + dir;
        wake();
      },
    };

    // Arrastrar de costado. Los gestos verticales siguen siendo del scroll por secciones.
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastT = 0;
    let decided: "x" | "y" | null = null;
    const perPhoto = () => el.clientWidth * 0.3;
    const onDown = (e: PointerEvent) => {
      startX = lastX = e.clientX;
      startY = e.clientY;
      lastT = performance.now();
      decided = e.pointerType === "mouse" ? "x" : null;
      dragging = decided === "x";
      if (dragging) el.setPointerCapture(e.pointerId);
      vel = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && !e.buttons) return;
      if (decided === null) {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        if (dx < 6 && dy < 6) return;
        decided = dx > dy ? "x" : "y";
        if (decided === "x") {
          dragging = true;
          el.setPointerCapture(e.pointerId);
        }
      }
      if (!dragging) return;
      const now = performance.now();
      const d = -(e.clientX - lastX) / perPhoto();
      offset += d;
      vel = vel * 0.6 + (d / Math.max((now - lastT) / 1000, 1e-3)) * 0.4;
      lastX = e.clientX;
      lastT = now;
      wake();
    };
    const onUp = () => {
      decided = null;
      if (!dragging) return;
      dragging = false;
      // Con impulso: un deslizamiento rápido pasa más de una foto.
      target = Math.round(offset + Math.max(Math.min(vel * 0.2, 3), -3));
      wake();
    };
    let wheelTimer = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      offset += e.deltaX / perPhoto();
      target = offset;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        target = Math.round(offset);
        wake();
      }, 140);
      wake();
    };

    const ro = new ResizeObserver(place);
    ro.observe(el);
    place();
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(wheelTimer);
      ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("wheel", onWheel);
      api.current = null;
    };
  }, [n]);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div
        ref={stage}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Fotos de las noches"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") api.current?.go(1);
          if (e.key === "ArrowLeft") api.current?.go(-1);
        }}
        className="inf-espiral relative w-full flex-1 cursor-grab touch-none select-none active:cursor-grabbing"
      >
        {photos.map((src, i) => (
          <div
            key={src}
            ref={(node) => {
              items.current[i] = node;
            }}
            className="inf-espiral-foto absolute left-1/2 top-1/2 overflow-hidden rounded-2xl"
          >
            <Image src={src} alt="" fill sizes="(min-width: 640px) 18rem, 50vw" className="object-cover" draggable={false} />
            <div
              ref={(node) => {
                shades.current[i] = node;
              }}
              className="absolute inset-0 bg-black"
              style={{ opacity: 0 }}
              aria-hidden
            />
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => api.current?.go(-1)}
          aria-label="Foto anterior"
          className="grid size-9 place-items-center rounded-full border border-white/12 bg-white/5 transition-[background-color,transform] duration-200 ease-out hover:bg-white/10 active:scale-[0.94]"
        >
          <svg viewBox="0 0 20 20" className="size-3.5 rotate-180" aria-hidden>
            <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="min-w-[3.75rem] text-center text-xs tabular-nums leading-none text-white/55" aria-live="polite">
          {String(current + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </p>
        <button
          type="button"
          onClick={() => api.current?.go(1)}
          aria-label="Foto siguiente"
          className="grid size-9 place-items-center rounded-full border border-white/12 bg-white/5 transition-[background-color,transform] duration-200 ease-out hover:bg-white/10 active:scale-[0.94]"
        >
          <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden>
            <path d="M7 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
