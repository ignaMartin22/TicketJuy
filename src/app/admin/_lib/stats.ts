import type { AdminEvent, TicketKind } from "./types";

export type Totals = { sold: number; capacity: number; revenue: number };

const empty = (): Totals => ({ sold: 0, capacity: 0, revenue: 0 });

/** Cupo que cuenta: una entrada desactivada ya no se vende, así que solo suma lo que vendió. */
export const liveCapacity = (t: { capacity: number; sold: number; isActive?: boolean }) =>
  t.isActive === false ? t.sold : t.capacity;

/** Vendidas, cupo y recaudación (a precio de entrada, sin cargo de servicio). */
export function eventTotals(event: AdminEvent, kind?: TicketKind): Totals {
  return event.ticketTypes
    .filter((t) => !kind || t.kind === kind)
    .reduce((acc, t) => {
      acc.sold += t.sold;
      acc.capacity += liveCapacity(t);
      acc.revenue += t.sold * t.price;
      return acc;
    }, empty());
}

export function sumTotals(list: Totals[]): Totals {
  return list.reduce((acc, t) => {
    acc.sold += t.sold;
    acc.capacity += t.capacity;
    acc.revenue += t.revenue;
    return acc;
  }, empty());
}

/** 0 a 100, redondeado. Un cupo vacío cuenta como 0 %. */
export function percent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export function hasSales(event: AdminEvent) {
  return event.ticketTypes.some((t) => t.sold > 0);
}

export const formatCount = (n: number) => new Intl.NumberFormat("es-AR").format(n);
