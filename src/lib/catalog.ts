import { SITE } from "@/lib/site";
import { cacheLife, cacheTag } from "next/cache";
import {
  events as mockEvents,
  getEvent,
  getVenue,
  getVenueEvents,
  venues as mockVenues,
  type Event,
  type Venue,
} from "@/lib/mock-data";

// Catálogo de fechas y entradas.
// Con TICKETERA_API_URL lo lee de ticketera-core (Django); sin la variable usa los datos de prueba.
// Se lee siempre desde el servidor de Next: el navegador nunca habla directo con la API.

export type VenueCatalog = { venue: Venue; events: Event[] };
export type EventCatalog = { venue: Venue; event: Event };

/** Boliche de la portada. Se define en src/lib/site.ts. */
export const HOME_VENUE = SITE.homeVenue;

export function hasLiveCatalog() {
  return Boolean(process.env.TICKETERA_API_URL);
}

export function apiUrl(path: string) {
  const base = process.env.TICKETERA_API_URL;
  if (!base) throw new Error("Falta configurar TICKETERA_API_URL");
  return new URL(path, base);
}

/**
 * URL de una imagen subida al back (la portada de una fecha). El back la manda absoluta;
 * si viene relativa ("/media/..."), es relativa al back y no al front.
 */
export function mediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (!url.startsWith("/")) return url;
  const base = process.env.TICKETERA_API_URL;
  return base ? new URL(url, base).toString() : undefined;
}

/** La API manda null en los campos vacíos; el front los espera ausentes. */
function withoutNulls<T extends object>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null)) as T;
}

/** Datos del boliche que dependen de los archivos del front (por ejemplo, el tamaño del logo). */
function withLocalAssets(venue: Venue): Venue {
  const local = getVenue(venue.slug);
  return { ...withoutNulls(venue), logoSize: local?.logoSize };
}

const normalizeEvent = (event: Event) => {
  const e = withoutNulls(event);
  return e.cover ? { ...e, cover: mediaUrl(e.cover) } : e;
};

async function fetchCatalog<T>(path: string): Promise<T | null> {
  const response = await fetch(apiUrl(path), { headers: { Accept: "application/json" } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`El catálogo respondió con estado ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getVenueCatalog(slug: string): Promise<VenueCatalog | null> {
  "use cache";
  // Los cupos se vuelven a pedir cada minuto. Igual, la API controla el cupo al reservar.
  cacheLife("minutes");
  cacheTag("catalog", `venue:${slug}`);
  if (!hasLiveCatalog()) {
    const venue = getVenue(slug);
    return venue ? { venue, events: getVenueEvents(slug) } : null;
  }
  const data = await fetchCatalog<VenueCatalog>(`/api/v1/venues/${encodeURIComponent(slug)}/events/`);
  return data && { venue: withLocalAssets(data.venue), events: data.events.map(normalizeEvent) };
}

export async function getEventCatalog(venueSlug: string, eventSlug: string): Promise<EventCatalog | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", `venue:${venueSlug}`);
  if (!hasLiveCatalog()) {
    const venue = getVenue(venueSlug);
    const event = getEvent(venueSlug, eventSlug);
    return venue && event ? { venue, event } : null;
  }
  const data = await fetchCatalog<EventCatalog>(
    `/api/v1/venues/${encodeURIComponent(venueSlug)}/events/${encodeURIComponent(eventSlug)}/`,
  );
  return data && { venue: withLocalAssets(data.venue), event: normalizeEvent(data.event) };
}

/**
 * Rutas a prerenderar en el build. Con Cache Components tiene que haber al menos una:
 * si la API no tiene fechas (o no responde), se usan las de prueba y esas páginas dan 404.
 */
export async function eventParams() {
  const live = hasLiveCatalog()
    ? await getVenueCatalog(HOME_VENUE).catch(() => null)
    : null;
  const list = live?.events.length ? live.events : mockEvents;
  return list.map((e) => ({ venue: e.venueSlug, event: e.slug }));
}

export function venueParams() {
  return mockVenues.map((v) => ({ venue: v.slug }));
}
