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

  const dondeValue = `${venue.name}, ${venue.address === venue.city ? venue.city : `${venue.address}, ${venue.city}`}`;
  // Lo que decide la compra va arriba de las entradas; el resto, después.
  const keyFacts = [
    ["Cuándo", formatNight(event.startsAt)],
    ["Dónde", dondeValue],
    ["Edad", `Mayores de ${event.ageLimit}, con DNI`],
  ];
  const moreFacts = [
    ["Ingreso", event.doorsNote],
    ...(event.dressCode ? [["Vestimenta", event.dressCode]] : []),
  ];

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-6 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:gap-8 sm:px-6 sm:pt-6 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
      <div className="lg:sticky lg:top-20 lg:self-start">
        {/* En el celu el flyer es más bajo, para que las entradas aparezcan enseguida. */}
        <Flyer event={event} backdrop={venue.flyerBackdrop} priority className="aspect-[5/4] sm:aspect-[4/5] sm:rounded-[1.75rem]" />
      </div>

      <div className="px-4 sm:px-0 lg:pt-2">
        {/* El título y el lineup ya están en el flyer. */}
        <h1 className="sr-only">{event.title}</h1>

        <dl style={{ "--d": "200ms" } as CSSProperties} className="entra-lista grid gap-x-6 gap-y-3 rounded-2xl bg-noche-2 p-4 sm:grid-cols-2 sm:p-5">
          {keyFacts.map(([label, value]) => (
            <Fact key={label} label={label} value={value} />
          ))}
        </dl>

        <h2 id="entradas" className="entra mt-8 scroll-mt-20 text-xl font-semibold" style={{ "--d": "400ms" } as CSSProperties}>Elegí tus entradas</h2>
        <TicketPicker venue={venue} event={event} />

        <p className="mt-10 max-w-[36rem] text-lg">{event.description}</p>
        {moreFacts.length > 0 && (
          <dl className="mt-6 grid gap-x-6 gap-y-3 rounded-2xl bg-noche-2 p-4 sm:grid-cols-2 sm:p-5">
            {moreFacts.map(([label, value]) => (
              <Fact key={label} label={label} value={value} />
            ))}
          </dl>
        )}
        {venue.mapsUrl && (
          <a
            href={venue.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block py-3 font-semibold text-accent underline-offset-4 hover:underline"
          >
            Cómo llegar a {venue.name}
          </a>
        )}
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-tenue">{label}</dt>
      <dd className="font-medium first-letter:uppercase">{value}</dd>
    </div>
  );
}
