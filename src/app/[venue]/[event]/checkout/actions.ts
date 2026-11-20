"use server";

import { updateTag } from "next/cache";
import type { Cart } from "@/lib/cart";
import { apiUrl, hasLiveCatalog } from "@/lib/catalog";
import type { Order } from "@/lib/orders";

/** Sin teléfono: las entradas todavía no se envían por WhatsApp (el back lo acepta vacío). */
export type Buyer = { name: string; email: string };

/** Códigos de error de la API más "network" (no hubo respuesta) y "unavailable" (sin API configurada). */
export type CreateOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reserva el cupo en ticketera-core. El precio y el cargo de servicio los fija la API.
 * El navegador genera idempotencyKey una vez por intento de compra y la repite al reintentar,
 * así un doble toque o un corte de red no reserva dos veces.
 */
export async function createOrder(
  venueSlug: string,
  eventSlug: string,
  buyer: Buyer,
  cart: Cart,
  idempotencyKey: string,
): Promise<CreateOrderResult> {
  if (!hasLiveCatalog()) return { ok: false, error: "unavailable" };
  if (!UUID.test(idempotencyKey)) return { ok: false, error: "invalid_request" };

  const path = [venueSlug, "events", eventSlug, "orders"].map(encodeURIComponent).join("/");
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/v1/venues/${path}/`), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({
        email: buyer.email.trim(),
        name: buyer.name.trim(),
        items: Object.entries(cart).map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity })),
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, error: "network" };
  }

  const data = (await response.json().catch(() => ({}))) as { order?: Order; error?: string };
  // Cambió el cupo (por esta reserva o porque no alcanzó): que la página del evento lo muestre ya.
  if (response.ok || response.status === 409) updateTag(`venue:${venueSlug}`);
  if (response.ok && data.order) return { ok: true, orderId: data.order.id };
  return { ok: false, error: data.error ?? (response.status >= 500 ? "network" : "invalid_request") };
}
