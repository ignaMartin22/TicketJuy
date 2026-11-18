import { getEvent, getVenue, getVenueEvents, type Event, type Venue } from "@/lib/mock-data";

type VenueCatalog = { venue: Venue; events: Event[] };
type EventCatalog = { venue: Venue; event: Event };

export function hasLiveCatalog() {
  return Boolean(process.env.TICKETERA_API_URL);
}

async function getCatalog<T>(path: string): Promise<T | null> {
  const base = process.env.TICKETERA_API_URL;
  if (!base) throw new Error("Falta configurar TICKETERA_API_URL");
  const response = await fetch(new URL(path, base), { cache: "no-store" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`El catálogo respondió con estado ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getVenueCatalog(slug: string): Promise<VenueCatalog | null> {
  if (hasLiveCatalog()) {
    return getCatalog<VenueCatalog>(`/api/v1/venues/${encodeURIComponent(slug)}/events/`);
  }
  const venue = getVenue(slug);
  return venue ? { venue, events: getVenueEvents(slug) } : null;
}

export async function getEventCatalog(venueSlug: string, eventSlug: string): Promise<EventCatalog | null> {
  if (hasLiveCatalog()) {
    const venue = encodeURIComponent(venueSlug);
    const event = encodeURIComponent(eventSlug);
    return getCatalog<EventCatalog>(`/api/v1/venues/${venue}/events/${event}/`);
  }
  const venue = getVenue(venueSlug);
  const event = getEvent(venueSlug, eventSlug);
  return venue && event ? { venue, event } : null;
}
