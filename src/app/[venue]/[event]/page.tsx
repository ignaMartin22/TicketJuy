import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketPicker } from "@/components/ticket-picker";
import { events, getEvent, getVenue } from "@/lib/mock-data";
import { nightParts } from "@/lib/format";
// Las variables y estilos de la marca (las entradas con talón) viven acá.
import "@/app/(infinity)/infinity.css";

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

  const lugar = venue.address === venue.city ? venue.city : `${venue.address}, ${venue.city}`;
  const d = nightParts(event.startsAt);

  return (
    // .infinity trae las variables de la marca; el fondo lo sigue poniendo el body.
    <div className="infinity bg-transparent!">
      {/* Todo en una pantalla: los datos de la fecha, las entradas y listo. */}
      <main className="ev-grilla mx-auto w-full max-w-5xl px-4 pb-6 pt-8 sm:px-6 sm:pt-12 lg:pb-4 lg:pt-12">
        <header className="entra [grid-area:titulo]">
          <h1 className="inf-titulo text-[clamp(1.9rem,7vw,3.25rem)] uppercase leading-[0.95] text-balance">{event.title}</h1>
          <p className="mt-2 text-white/75 sm:text-lg">{event.lineup.join(" · ")}</p>

          {/* Los detalles de la fecha, como en una entrada impresa. */}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-white/10 py-4 sm:mt-6">
            <Dato icon={<IconoCalendario />} label="Fecha">
              <span className="capitalize">{d.weekday.slice(0, 3)}</span> {d.day} {d.month}, {d.time} h
            </Dato>
            <Dato icon={<IconoPin />} label="Lugar">
              {venue.mapsUrl ? (
                <a href={venue.mapsUrl} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-[var(--inf-magenta)]">
                  {venue.name}
                </a>
              ) : (
                venue.name
              )}
              <span className="text-white/50 max-sm:hidden">, {lugar}</span>
            </Dato>
            <Dato icon={<IconoDni />} label="Edad">
              +{event.ageLimit}, con DNI
            </Dato>
            <Dato icon={<IconoPuerta />} label="Ingreso">
              {event.doorsNote}
            </Dato>
            {event.dressCode && (
              <Dato icon={<IconoRemera />} label="Vestimenta">
                {event.dressCode}
              </Dato>
            )}
          </dl>
        </header>

        <section aria-labelledby="entradas" className="[grid-area:compra] lg:sticky lg:top-24 lg:self-start">
          <h2 id="entradas" className="inf-titulo scroll-mt-24 text-xl sm:text-2xl">
            Elegí tus entradas
          </h2>
          <TicketPicker venue={venue} event={event} />
        </section>

        <p className="[grid-area:info] max-w-[34rem] text-white/70 text-pretty">{event.description}</p>
      </main>
    </div>
  );
}

function Dato({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 text-[var(--inf-magenta)]">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-white/50">{label}</dt>
        <dd className="text-[0.95rem] leading-snug text-white/90">{children}</dd>
      </div>
    </div>
  );
}

const icono = {
  viewBox: "0 0 24 24",
  className: "size-[1.1rem]",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function IconoCalendario() {
  return (
    <svg {...icono}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconoPin() {
  return (
    <svg {...icono}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
function IconoDni() {
  return (
    <svg {...icono}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="9" cy="11" r="2" />
      <path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M15 10h3M15 14h3" />
    </svg>
  );
}
function IconoPuerta() {
  return (
    <svg {...icono}>
      <path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18" />
      <circle cx="15" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}
function IconoRemera() {
  return (
    <svg {...icono}>
      <path d="M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z" />
    </svg>
  );
}
