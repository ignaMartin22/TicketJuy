"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { checkOrder } from "./actions";

/** Cada cuánto se pregunta si el pago se confirmó (la guía pide entre 3 y 5 segundos). */
const EVERY_MS = 4_000;
/** Margen después del vencimiento: un pago hecho en el último segundo puede tardar en llegar. */
const GRACE_MS = 2 * 60_000;

/**
 * Mientras el pedido espera el pago, consulta al backend cada pocos segundos y recarga
 * la página apenas cambia (pagado, vencido o en revisión). No dibuja nada.
 * Se detiene con la pestaña oculta y vuelve a consultar al volver.
 */
export function PaymentWatcher({
  venueSlug,
  eventSlug,
  orderId,
  status,
  expiresAt,
}: {
  venueSlug: string;
  eventSlug: string;
  orderId: string;
  status: string;
  expiresAt: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const deadline = new Date(expiresAt).getTime() + GRACE_MS;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const poll = async () => {
      timer = undefined;
      if (stopped || Date.now() > deadline) return;
      if (document.visibilityState === "visible") {
        const order = await checkOrder(venueSlug, eventSlug, orderId);
        if (stopped) return;
        if (order && (order.status !== status || order.paymentReview)) {
          router.refresh();
          return;
        }
      }
      timer = setTimeout(poll, EVERY_MS);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && timer !== undefined) {
        clearTimeout(timer);
        void poll();
      }
    };

    timer = setTimeout(poll, EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [venueSlug, eventSlug, orderId, status, expiresAt, router]);

  return null;
}
