import { apiUrl } from "@/lib/catalog";

// Pedidos sin cuenta en ticketera-core. Solo se usan desde el servidor de Next.

export type OrderItem = {
  ticketTypeId: string;
  quantity: number;
  /** Importes en ARS como texto decimal ("10000.00"), tal como los fija la API. */
  unitPrice: string;
  unitServiceFee: string;
};

/** Entrada emitida de un pedido pagado. */
export type OrderTicket = {
  id: string;
  ticketTypeId: string;
  ticketTypeName: string;
  /** Texto exacto que va dentro del QR. */
  qr: string;
  /** Fecha ISO en que se quemó en la puerta, o null si sigue sin usar. */
  usedAt: string | null;
  /** Entradas de lista de RRPP: hora límite para ingresar (ISO), o null si no tiene. */
  validUntil?: string | null;
};

export type Order = {
  id: string;
  status: "pending_payment" | "expired" | "paid";
  expiresAt: string;
  currency: "ARS";
  total: string;
  items: OrderItem[];
  /** Vacío si el pedido no está pagado. */
  tickets: OrderTicket[];
  /**
   * true si Mercado Pago aprobó un pago que no se pudo convertir en entradas
   * (llegó con la reserva vencida y sin cupo, no coincidió el importe o se pagó dos veces).
   * No hay reembolso automático: el comprador tiene que hablar con el boliche.
   */
  paymentReview: boolean;
  /** Con qué se puede pagar este pedido, según las cuentas que tenga conectadas el boliche. */
  paymentMethods: PaymentMethod[];
};

/** Medios de pago que puede ofrecer un boliche. Nave cubre Naranja X y Galicia. */
export type PaymentMethod = "mercadopago" | "macro" | "nave";

export const PAYMENT_METHODS: readonly PaymentMethod[] = ["mercadopago", "macro", "nave"];

const orderPath = (venueSlug: string, eventSlug: string, orderId: string) =>
  [venueSlug, "events", eventSlug, "orders", orderId].map(encodeURIComponent).join("/");

export async function getOrder(venueSlug: string, eventSlug: string, orderId: string): Promise<Order | null> {
  const response = await fetch(apiUrl(`/api/v1/venues/${orderPath(venueSlug, eventSlug, orderId)}/`), {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`La API de pedidos respondió con estado ${response.status}`);
  return ((await response.json()) as { order: Order }).order;
}

/**
 * Le pide al backend que consulte el pago en Mercado Pago y devuelve el pedido actualizado.
 * Sirve para no depender del aviso (webhook) de Mercado Pago, que puede tardar unos segundos.
 * Si el pedido nunca pasó por el pago, el backend no consulta nada y lo devuelve igual.
 */
export async function syncOrder(venueSlug: string, eventSlug: string, orderId: string): Promise<Order | null> {
  const response = await fetch(apiUrl(`/api/v1/venues/${orderPath(venueSlug, eventSlug, orderId)}/payment/sync/`), {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`La API de pagos respondió con estado ${response.status}`);
  return ((await response.json()) as { order: Order }).order;
}

/** Códigos de error de la API más "network" (no hubo respuesta o vino algo inesperado). */
export type PaymentLinkResult = { ok: true; initPoint: string } | { ok: false; error: string };

/**
 * Sólo se manda al comprador a la pasarela elegida. Mercado Pago se valida por dominio; Macro
 * pasa por una página del backend que arma el formulario del banco, y el backend valida el
 * dominio del checkout de Nave antes de devolverlo. En los tres casos tiene que ser https.
 */
function isPaymentUrl(value: string, method: PaymentMethod) {
  try {
    const url = new URL(value);
    // En desarrollo el backend corre en localhost sin https.
    const local = url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(local && method !== "mercadopago")) return false;
    return method === "mercadopago" ? /(^|\.)mercadopago\.com(\.ar)?$/.test(url.hostname) : true;
  } catch {
    return false;
  }
}

/**
 * Pide el link de pago del pedido con el medio elegido. El backend arma el pago con la cuenta
 * del boliche; el front no usa SDK ni credenciales. Es idempotente: devuelve siempre el mismo link.
 */
export async function getPaymentLink(
  venueSlug: string,
  eventSlug: string,
  orderId: string,
  method: PaymentMethod = "mercadopago",
): Promise<PaymentLinkResult> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/v1/venues/${orderPath(venueSlug, eventSlug, orderId)}/payment/`), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: method }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  const data = (await response.json().catch(() => ({}))) as { initPoint?: string; error?: string };
  if (response.ok) {
    return data.initPoint && isPaymentUrl(data.initPoint, method)
      ? { ok: true, initPoint: data.initPoint }
      : { ok: false, error: "network" };
  }
  return { ok: false, error: data.error ?? "network" };
}
