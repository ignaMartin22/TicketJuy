import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Flyer } from "@/components/flyer";
import { TicketPicker } from "@/components/ticket-picker";
import { formatNight } from "@/lib/format";
import { events, getEvent, getVenue } from "@/lib/mock-data";

export function generateStaticParams() {
  return events.map((e) => ({ venue: e.venueSlug, event: e.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[venue]/[event]">): Promise<Metadata> {
  const { venue, event } = await params;
  return { title: getEvent(venue, event)?.title ?? "Evento" };
}

export default async function EventPage({
  params,
}: PageProps<"/[venue]/[event]">) {
  const { venue: venueSlug, event: eventSlug } = await params;
  const venue = getVenue(venueSlug);
  const event = getEvent(venueSlug, eventSlug);
  if (!venue || !event) notFound();

  const facts = [
    ["Cuándo", formatNight(event.startsAt)],
    ["Dónde", `${venue.name}, ${venue.address === venue.city ? venue.city : `${venue.address}, ${venue.city}`}`],
    ["Ingreso", event.doorsNote],
    ["Edad", `Mayores de ${event.ageLimit}, con DNI`],
    ...(event.dressCode ? [["Vestimenta", event.dressCode]] : []),
  ];

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-8 pb-32 sm:px-6 sm:pt-6 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Flyer event={event} backdrop={venue.flyerBackdrop} priority className="aspect-[4/5] sm:rounded-[1.75rem]" />
      </div>

      <div className="px-4 sm:px-0 lg:pt-2">
        {/* El título y el lineup ya están en el flyer. */}
        <h1 className="sr-only">{event.title}</h1>
        <p className="entra max-w-[36rem] text-lg" style={{ "--d": "200ms" } as CSSProperties}>{event.description}</p>

        <dl style={{ "--d": "320ms" } as CSSProperties} className="entra-lista mt-8 grid gap-x-6 gap-y-4 rounded-2xl bg-noche-2 p-5 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-tenue">{label}</dt>
              <dd className="font-medium first-letter:uppercase">{value}</dd>
            </div>
          ))}
        </dl>
        {venue.mapsUrl && (
          <a
            href={venue.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-accent underline-offset-4 hover:underline"
          >
            Cómo llegar a {venue.name}
          </a>
        )}

        <h2 className="entra mt-12 text-lg font-semibold" style={{ "--d": "450ms" } as CSSProperties}>Elegí tus entradas</h2>
        <TicketPicker venue={venue} event={event} />
      </div>
    </main>
  );
}
