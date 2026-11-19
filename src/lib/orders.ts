import { apiUrl } from "@/lib/catalog";

// Pedidos sin cuenta en ticketera-core. Solo se usan desde el servidor de Next.

export type OrderItem = {
  ticketTypeId: string;
  quantity: number;
  /** Importes en ARS como texto decimal ("10000.00"), tal como los fija la API. */
  unitPrice: string;
  unitServiceFee: string;
};

export type Order = {
  id: string;
  status: "pending_payment" | "expired";
  expiresAt: string;
  currency: "ARS";
  total: string;
  items: OrderItem[];
};

export async function getOrder(venueSlug: string, eventSlug: string, orderId: string): Promise<Order | null> {
  const path = [venueSlug, "events", eventSlug, "orders", orderId].map(encodeURIComponent).join("/");
  const response = await fetch(apiUrl(`/api/v1/venues/${path}/`), { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`La API de pedidos respondió con estado ${response.status}`);
  return ((await response.json()) as { order: Order }).order;
}
