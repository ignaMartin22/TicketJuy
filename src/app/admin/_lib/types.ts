import type { Event, TicketType } from "@/lib/mock-data";

/** Común o VIP: así agrupa el dueño las entradas en el panel. */
export type TicketKind = "general" | "vip";

export type AdminTicketType = TicketType & {
  kind: TicketKind;
  /** false = desactivada: no se vende más, pero sus vendidas siguen contando. */
  isActive?: boolean;
};

export type AdminEvent = Omit<Event, "ticketTypes"> & {
  ticketTypes: AdminTicketType[];
  /** Foto de portada como data URL (comprimida en el navegador). */
  cover?: string;
  /** Si está en false, la fecha se ve pero no se venden entradas. */
  salesOpen: boolean;
  /** false = borrador: no aparece en la web. */
  isPublished: boolean;
};

export const KIND_LABEL: Record<TicketKind, string> = {
  general: "Común",
  vip: "VIP",
};
