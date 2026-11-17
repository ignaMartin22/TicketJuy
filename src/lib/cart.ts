import type { Event } from "@/lib/mock-data";

/** Cantidad por tipo de entrada: { "vip": 2 } */
export type Cart = Record<string, number>;

export const MAX_PER_ORDER = 10;

/** { vip: 2, general: 1 } -> "vip:2,general:1" (va en la URL del checkout) */
export function encodeCart(cart: Cart) {
  return Object.entries(cart)
    .map(([id, qty]) => `${id}:${qty}`)
    .join(",");
}

/** Lee el carrito de la URL y descarta tipos inexistentes o cantidades inválidas. */
export function decodeCart(raw: string | null, event: Event): Cart {
  const cart: Cart = {};
  let total = 0;
  for (const part of (raw ?? "").split(",")) {
    const [id, qtyRaw] = part.split(":");
    const type = event.ticketTypes.find((t) => t.id === id);
    const qty = Number.parseInt(qtyRaw ?? "", 10);
    if (!type || !Number.isInteger(qty) || qty <= 0) continue;
    const allowed = Math.min(qty, type.capacity - type.sold, MAX_PER_ORDER - total);
    if (allowed <= 0) continue;
    cart[id] = allowed;
    total += allowed;
  }
  return cart;
}
