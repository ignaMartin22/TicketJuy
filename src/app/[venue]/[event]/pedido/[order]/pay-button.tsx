"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { payOrder, type PayState } from "./actions";

/** Qué ve el comprador por cada código de error del link de pago. */
const MESSAGES: Record<string, string> = {
  order_expired: "La reserva venció. Volvé a elegir tus entradas.",
  order_already_paid: "Este pedido ya está pago.",
  venue_not_connected: "El pago online no está disponible para esta fecha.",
  mp_unavailable: "Mercado Pago no respondió. Probá de nuevo en unos segundos.",
  mp_not_configured: "El pago online no está disponible por ahora.",
  not_found: "No encontramos este pedido.",
  network: "No pudimos conectarnos. Revisá tu señal y probá de nuevo.",
};

/** Con estos errores el pedido cambió de estado: se recarga la página para mostrarlo. */
const REFRESH = new Set(["order_expired", "order_already_paid"]);

export function PayButton({ venueSlug, eventSlug, orderId }: { venueSlug: string; eventSlug: string; orderId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<PayState>(
    payOrder.bind(null, venueSlug, eventSlug, orderId),
    { error: null },
  );

  useEffect(() => {
    if (state.error && REFRESH.has(state.error)) router.refresh();
  }, [state, router]);

  const blocked = state.error === "venue_not_connected" || state.error === "mp_not_configured";

  return (
    <form action={action} className="mt-4">
      <button
        type="submit"
        disabled={pending || blocked}
        className="flex min-h-14 w-full items-center justify-center rounded-full bg-luz text-lg font-semibold text-noche transition-transform duration-200 ease-out active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
      >
        {pending ? "Abriendo Mercado Pago…" : "Pagar con Mercado Pago"}
      </button>
      <p role="status" className="mt-2 min-h-5 text-center text-sm text-tenue">
        {state.error ? (MESSAGES[state.error] ?? MESSAGES.network) : "Te llevamos a Mercado Pago para pagar."}
      </p>
    </form>
  );
}
