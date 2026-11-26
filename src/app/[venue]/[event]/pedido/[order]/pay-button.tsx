"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import type { PaymentMethod } from "@/lib/orders";
import { payOrder, type PayState } from "./actions";

/** Cómo se llama cada medio para el comprador. Nave es la plataforma de Naranja X y Galicia. */
const NAMES: Record<PaymentMethod, string> = {
  mercadopago: "Mercado Pago",
  macro: "Macro Click de Pago",
  nave: "Naranja X",
};

/** Qué ve el comprador por cada código de error del link de pago. */
const MESSAGES: Record<string, string> = {
  order_expired: "La reserva venció. Volvé a elegir tus entradas.",
  order_already_paid: "Este pedido ya está pago.",
  venue_not_connected: "Ese medio de pago no está disponible para esta fecha.",
  mp_unavailable: "Mercado Pago no respondió. Probá de nuevo en unos segundos.",
  gateway_unavailable: "El medio de pago no respondió. Probá de nuevo o elegí otro.",
  mp_not_configured: "El pago online no está disponible por ahora.",
  gateway_not_configured: "Ese medio de pago no está disponible por ahora.",
  not_found: "No encontramos este pedido.",
  network: "No pudimos conectarnos. Revisá tu señal y probá de nuevo.",
};

/** Con estos errores el pedido cambió de estado: se recarga la página para mostrarlo. */
const REFRESH = new Set(["order_expired", "order_already_paid"]);
const BLOCKED = new Set(["venue_not_connected", "mp_not_configured", "gateway_not_configured"]);

export function PayButton({
  venueSlug,
  eventSlug,
  orderId,
  methods,
}: {
  venueSlug: string;
  eventSlug: string;
  orderId: string;
  methods: PaymentMethod[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<PayState, FormData>(
    payOrder.bind(null, venueSlug, eventSlug, orderId),
    { error: null },
  );
  // El medio del último botón tocado: para el texto de "abriendo…" y para saber cuál falló.
  const [chosen, setChosen] = useState<PaymentMethod | null>(null);
  // Si el backend todavía no informa medios, se ofrece Mercado Pago como hasta ahora.
  const options: PaymentMethod[] = methods.length > 0 ? methods : ["mercadopago"];
  const single = options.length === 1;

  useEffect(() => {
    if (state.error && REFRESH.has(state.error)) router.refresh();
  }, [state, router]);

  const failed = state.error ? chosen : null;
  const blocked = (method: PaymentMethod) => failed === method && BLOCKED.has(state.error ?? "");
  const status = state.error
    ? (MESSAGES[state.error] ?? MESSAGES.network)
    : single
      ? `Te llevamos a ${NAMES[options[0]]} para pagar.`
      : "Elegí con qué pagar. Te llevamos a la página de pago.";

  return (
    <form action={action} className="mt-4">
      <div className="flex flex-col gap-2.5">
        {options.map((method, i) => (
          <button
            key={method}
            type="submit"
            name="method"
            value={method}
            onClick={() => setChosen(method)}
            disabled={pending || blocked(method)}
            className={`flex min-h-14 w-full items-center justify-center rounded-full text-lg font-semibold transition-transform duration-200 ease-out active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${
              i === 0 ? "bg-luz text-noche" : "border border-white/20 text-luz"
            }`}
          >
            {pending && chosen === method ? `Abriendo ${NAMES[method]}…` : `Pagar con ${NAMES[method]}`}
          </button>
        ))}
      </div>
      <p role="status" className="mt-2 min-h-5 text-center text-sm text-tenue">
        {status}
      </p>
    </form>
  );
}
