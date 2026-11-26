"use server";

import { redirect } from "next/navigation";
import { getPaymentLink, PAYMENT_METHODS, syncOrder, type Order, type PaymentMethod } from "@/lib/orders";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PayState = { error: string | null };

/**
 * Pide el link de pago al backend con el medio elegido (el botón que se tocó manda `method`)
 * y manda al comprador a la pasarela.
 * Se usa con useActionState: si algo falla, devuelve el código de error para mostrarlo.
 */
export async function payOrder(
  venueSlug: string,
  eventSlug: string,
  orderId: string,
  _prev: PayState, // lo pasa useActionState
  form: FormData,
): Promise<PayState> {
  if (!UUID.test(orderId)) return { error: "not_found" };
  const chosen = form.get("method");
  const method: PaymentMethod = PAYMENT_METHODS.find((m) => m === chosen) ?? "mercadopago";
  const result = await getPaymentLink(venueSlug, eventSlug, orderId, method);
  if (!result.ok) return { error: result.error };
  // Fuera de cualquier try: redirect corta la ejecución lanzando un error.
  redirect(result.initPoint);
}

export type OrderCheck = Pick<Order, "status" | "paymentReview"> | null;

/**
 * Consulta si el pago ya se confirmó. La página del pedido la llama cada pocos segundos
 * mientras espera; devuelve null si no se pudo consultar (se reintenta en la próxima vuelta).
 */
export async function checkOrder(venueSlug: string, eventSlug: string, orderId: string): Promise<OrderCheck> {
  if (!UUID.test(orderId)) return null;
  try {
    const order = await syncOrder(venueSlug, eventSlug, orderId);
    return order && { status: order.status, paymentReview: order.paymentReview };
  } catch {
    return null;
  }
}
