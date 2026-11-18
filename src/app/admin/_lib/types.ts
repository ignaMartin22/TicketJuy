import type { Event, TicketType } from "@/lib/mock-data";

/** Común o VIP: así agrupa el dueño las entradas en el panel. */
export type TicketKind = "general" | "vip";

export type AdminTicketType = TicketType & { kind: TicketKind };

export type AdminEvent = Omit<Event, "ticketTypes"> & {
  ticketTypes: AdminTicketType[];
  /** Foto de portada como data URL (comprimida en el navegador). */
  cover?: string;
  /** Si está en false, la fecha se ve pero no se venden entradas. */
  salesOpen: boolean;
};

export const KIND_LABEL: Record<TicketKind, string> = {
  general: "Común",
  vip: "VIP",
};
