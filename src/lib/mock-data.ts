// Datos de prueba hasta conectar Supabase.
// Los nombres siguen las entidades del README (Venue, Event, TicketType, Ticket).
// Por fuera arrancamos solo con Infinity, pero el modelo ya es multi-boliche:
// todo cuelga de un Venue.

export type Venue = {
  slug: string;
  name: string;
  city: string;
  address: string;
  /** Usuario de Instagram sin "@". Vacío si todavía no lo tenemos. */
  instagram: string;
  /** Lema del boliche, si tiene. */
  tagline?: string;
  /** Logo blanco con fondo transparente (para fondos oscuros). */
  logo?: string;
  /** Ancho y alto del logo, para reservar su lugar. */
  logoSize?: [number, number];
  /** Foto del lugar para portadas. */
  cover?: string;
  /** Foto de fondo para los flyers provisorios. */
  flyerBackdrop?: string;
  mapsUrl?: string;
  /** Color de marca del boliche. Se usa como acento en sus páginas. */
  accent: string;
  /**
   * Cómo se presenta el precio (ver README, "Reglas de comisión"):
   * - "venue": el comprador paga el precio; el boliche absorbe las comisiones.
   * - "buyer": el comprador paga precio + cargo de servicio.
   */
  feeMode: "venue" | "buyer";
  /** Cargo de servicio al comprador (0.1 = 10 %). PROVISORIO: falta definir el porcentaje. */
  buyerFeeRate: number;
};

export type TicketType = {
  id: string;
  name: string;
  description: string;
  /** Precio en pesos. */
  price: number;
  capacity: number;
  sold: number;
};

export type Event = {
  slug: string;
  venueSlug: string;
  title: string;
  lineup: string[];
  description: string;
  /** ISO con zona horaria de Argentina. */
  startsAt: string;
  doorsNote: string;
  ageLimit: number;
  dressCode?: string;
  ticketTypes: TicketType[];
};

export type Ticket = {
  code: string;
  eventSlug: string;
  venueSlug: string;
  ticketTypeId: string;
  holderName: string;
  status: "valid" | "used" | "transferred" | "void";
  /** Para "used": cuándo entró. Para "transferred": a quién. */
  note?: string;
};

export const venues: Venue[] = [
  {
    slug: "infinity",
    name: "Infinity",
    city: "San Salvador de Jujuy",
    address: "San Salvador de Jujuy",
    // La cuenta todavía lleva el nombre viejo del boliche (Moon).
    instagram: "moon.nochesinfinitas",
    tagline: "Noches infinitas",
    logo: "/brand/infinity/infinity-logo.svg",
    logoSize: [416, 68],
    // Recortes de una foto de la pista, sin los carteles con el nombre viejo (Moon).
    cover: "/venues/infinity/pista-luces.jpg",
    flyerBackdrop: "/venues/infinity/pista-gente.jpg",
    // Mismo lugar que tenía Moon; la ficha de Google Maps todavía figura con el nombre viejo.
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=-24.1805835,-65.2718714",
    // Celeste de los carteles de neón del boliche.
    accent: "#4fc8ff",
    feeMode: "buyer",
    buyerFeeRate: 0.1,
  },
];

const general = (
  id: string,
  name: string,
  price: number,
  capacity: number,
  sold: number,
  description = "Ingreso general.",
): TicketType => ({ id, name, description, price, capacity, sold });

export const events: Event[] = [
  {
    slug: "noche-de-luna-llena",
    venueSlug: "infinity",
    title: "Noche de Luna Llena",
    lineup: ["Vale Quispe", "Residentes Infinity"],
    description:
      "La fecha grande del mes. Pista principal con house y tech house hasta el cierre.",
    startsAt: "2026-11-21T00:30:00-03:00",
    doorsNote: "Hasta las 3:00",
    ageLimit: 18,
    ticketTypes: [
      general("anticipada-1", "Anticipada, 1ª tanda", 8000, 200, 200),
      general("anticipada-2", "Anticipada, 2ª tanda", 10000, 300, 271),
      general(
        "vip",
        "VIP",
        18000,
        80,
        12,
        "Fila VIP en la puerta y acceso al sector VIP.",
      ),
    ],
  },
  {
    slug: "cumbia-hasta-el-alba",
    venueSlug: "infinity",
    title: "Cumbia hasta el alba",
    lineup: ["Los del Cerro", "DJ Tincho"],
    description: "Cumbia, cuarteto y algo de reggaetón. Banda en vivo a las 2:00.",
    startsAt: "2026-11-22T00:30:00-03:00",
    doorsNote: "Hasta las 3:30",
    ageLimit: 18,
    ticketTypes: [
      general("general", "General", 7000, 450, 188),
      general("grupo-4", "Pack 4 amigos", 24000, 60, 41, "4 ingresos generales."),
    ],
  },
  {
    slug: "fiesta-de-egresados",
    venueSlug: "infinity",
    title: "Fiesta de egresados",
    lineup: ["Residentes Infinity"],
    description: "Promo 2026. Fotógrafo en la entrada y cotillón incluido.",
    startsAt: "2026-12-05T00:30:00-03:00",
    doorsNote: "Hasta las 2:30",
    ageLimit: 18,
    dressCode: "Elegante sport",
    ticketTypes: [general("general", "General", 9000, 500, 104)],
  },
  {
    slug: "fin-de-ano",
    venueSlug: "infinity",
    title: "Año nuevo en Infinity",
    lineup: ["Vale Quispe", "DJ Tincho", "Residentes Infinity"],
    description: "Abrimos después del brindis. Barra libre de agua toda la noche.",
    startsAt: "2027-01-01T01:30:00-03:00",
    doorsNote: "Hasta las 4:00",
    ageLimit: 18,
    ticketTypes: [
      general("preventa", "Preventa", 15000, 300, 300),
      general("general", "General", 20000, 400, 62),
      general("vip", "VIP con mesa", 120000, 20, 7, "Mesa para 6 con una botella."),
    ],
  },
];

export const tickets: Ticket[] = [
  {
    code: "TJ-7K3M-Q9XA",
    eventSlug: "noche-de-luna-llena",
    venueSlug: "infinity",
    ticketTypeId: "anticipada-2",
    holderName: "Juan Pérez",
    status: "valid",
  },
  {
    code: "TJ-2PLR-8WDE",
    eventSlug: "noche-de-luna-llena",
    venueSlug: "infinity",
    ticketTypeId: "vip",
    holderName: "Camila Tolaba",
    status: "used",
    note: "Ingresó a las 01:42",
  },
  {
    code: "TJ-9QZT-4HNB",
    eventSlug: "cumbia-hasta-el-alba",
    venueSlug: "infinity",
    ticketTypeId: "general",
    holderName: "Martín Cruz",
    status: "transferred",
    note: "Transferida a Lucía Vilte",
  },
];

export function getVenue(slug: string) {
  return venues.find((v) => v.slug === slug);
}

export function getEvent(venueSlug: string, eventSlug: string) {
  return events.find((e) => e.venueSlug === venueSlug && e.slug === eventSlug);
}

export function getVenueEvents(venueSlug: string) {
  return events
    .filter((e) => e.venueSlug === venueSlug)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function getUpcomingEvents(limit?: number) {
  const sorted = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getTicket(code: string) {
  return tickets.find((t) => t.code === code);
}

export function cheapestAvailable(event: Event) {
  const open = event.ticketTypes.filter((t) => t.sold < t.capacity);
  return open.length ? Math.min(...open.map((t) => t.price)) : null;
}
