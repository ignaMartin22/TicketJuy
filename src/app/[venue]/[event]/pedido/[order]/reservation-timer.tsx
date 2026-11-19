"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Cuánto queda de la reserva. Al llegar a cero avisa que el cupo se liberó. */
export function ReservationTimer({ expiresAt, backHref }: { expiresAt: string; backHref: string }) {
  const end = new Date(expiresAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Antes de hidratar no se sabe la hora del celular: se reserva el lugar sin número.
  if (now === null) return <p className="h-12 rounded-2xl bg-white/[0.04]" aria-hidden />;

  const left = Math.max(0, Math.floor((end - now) / 1000));
  if (left === 0) {
    return (
      <p role="status" className="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm">
        La reserva venció y el cupo se liberó.{" "}
        <Link href={backHref} className="font-semibold underline underline-offset-4">
          Volver a elegir
        </Link>
      </p>
    );
  }
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  return (
    <p className="flex min-h-12 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm">
      <span className="text-tenue">Tu reserva vence en</span>
      <span className="display text-xl tabular-nums" role="timer" aria-live="off">
        {mm}:{ss}
      </span>
    </p>
  );
}
