"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Entrada holográfica: un brillo celeste-magenta que se mueve al inclinar el celu
 * (giroscopio) o al mover el mouse. El QR queda limpio para que se lea en la puerta:
 * la lámina va sobre la tarjeta, no sobre el código.
 */

type Props = {
  qr: string;
  code: string;
  title: string;
  when: string;
  holder: string;
  type: string;
};

type OrientationCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function HoloTicket({ qr, code, title, when, holder, type }: Props) {
  const card = useRef<HTMLDivElement>(null);
  const [giroActivo, setGiroActivo] = useState(false);
  const quitarGiro = useRef<(() => void) | null>(null);

  function mover(x: number, y: number) {
    // x, y entre -1 y 1
    const el = card.current;
    if (!el) return;
    el.style.setProperty("--hx", `${50 + x * 45}%`);
    el.style.setProperty("--hy", `${50 + y * 45}%`);
    el.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`;
  }

  function escucharGiro() {
    if (quitarGiro.current) return;
    const onGiro = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      setGiroActivo(true);
      const x = Math.max(-1, Math.min(1, e.gamma / 30));
      const y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      mover(x, y);
    };
    window.addEventListener("deviceorientation", onGiro);
    quitarGiro.current = () => window.removeEventListener("deviceorientation", onGiro);
  }

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const Ctor = window.DeviceOrientationEvent as OrientationCtor | undefined;
    // En Android funciona directo. En iPhone hace falta un toque (ver activar).
    if (Ctor && !Ctor.requestPermission) escucharGiro();
    return () => {
      quitarGiro.current?.();
      quitarGiro.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // iPhone pide permiso para el giroscopio, y solo dentro de un toque.
  async function activar() {
    const Ctor = window.DeviceOrientationEvent as OrientationCtor | undefined;
    if (!Ctor?.requestPermission || quitarGiro.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if ((await Ctor.requestPermission()) === "granted") escucharGiro();
    } catch {
      // Sin permiso queda el holograma quieto.
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={card}
        onPointerMove={(e) => {
          if (giroActivo || e.pointerType === "touch") return;
          const r = e.currentTarget.getBoundingClientRect();
          mover(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
        }}
        onPointerLeave={() => !giroActivo && mover(0, 0)}
        onClick={activar}
        className="relative w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--inf-superficie)] transition-transform duration-200 ease-out will-change-transform motion-reduce:transition-none"
        style={{ boxShadow: "0 30px 80px -30px color-mix(in oklch, var(--inf-magenta) 55%, transparent), 0 0 0 1px #ffffff10" }}
      >
        <div className="inf-poster relative px-6 pb-5 pt-5">
          <div className="inf-grano" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/infinity/infinity-logo.svg" alt="Infinity Producciones" className="relative h-5" />
          <h3 className="inf-titulo relative mt-4 text-3xl uppercase">{title}</h3>
          <p className="relative mt-1 text-sm capitalize text-white/80">{when}</p>
        </div>

        <div className="relative flex flex-col items-center px-5 pb-5 pt-5">
          <div
            className="w-full max-w-64 rounded-2xl bg-white p-3 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
            role="img"
            aria-label={`Código QR de la entrada ${code}`}
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <p className="mt-3 font-semibold tracking-[0.18em] tabular-nums">{code}</p>
          <dl className="mt-4 grid w-full grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[var(--inf-tenue)]">Titular</dt>
              <dd className="font-semibold">{holder}</dd>
            </div>
            <div>
              <dt className="text-[var(--inf-tenue)]">Entrada</dt>
              <dd className="font-semibold">{type}</dd>
            </div>
          </dl>
          <p className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[color-mix(in_oklch,var(--inf-cian)_60%,transparent)] py-2 font-semibold text-[var(--inf-cian)]">
            <span className="size-2 rounded-full bg-[var(--inf-cian)] shadow-[0_0_10px_var(--inf-cian)]" aria-hidden />
            Válida para ingresar
          </p>
        </div>

        {/* La lámina: tapa el encabezado y los bordes, deja el QR legible. */}
        <div className="inf-holo [mask-image:radial-gradient(closest-side_at_50%_58%,transparent_55%,#000_80%)]" aria-hidden />
      </div>

      <p className="text-center text-sm text-[var(--inf-tenue)]">
        Tocá la entrada y mové el celu (o pasá el mouse) para ver el holograma.
      </p>
    </div>
  );
}
