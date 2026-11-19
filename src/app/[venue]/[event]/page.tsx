import { Suspense, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketPicker } from "@/components/ticket-picker";
import { eventParams, getEventCatalog } from "@/lib/catalog";
import { nightParts } from "@/lib/format";
// Las variables y estilos de la marca (afiche, franja y entradas) viven acá.
import "@/app/(infinity)/infinity.css";

export function generateStaticParams() {
  return eventParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/[venue]/[event]">): Promise<Metadata> {
  const { venue, event } = await params;
  return { title: (await getEventCatalog(venue, event))?.event.title ?? "Evento" };
}

export default function EventPage({ params }: PageProps<"/[venue]/[event]">) {
  return (
    // .infinity trae las variables de la marca; el fondo lo sigue poniendo el body.
    <div className="infinity bg-transparent!">
      {/* Todo en una pantalla: los datos de la fecha, las entradas y listo. */}
      <main className="ev-grilla mx-auto w-full max-w-5xl px-4 pb-6 pt-8 sm:px-6 sm:pt-12 lg:pb-4 lg:pt-8">
        {/*
          Lo que depende de la fecha (que sale de la URL) va dentro de Suspense: al
          navegar desde otra página, la grilla y el esqueleto aparecen al instante y
          los datos entran apenas se resuelven los params.
        */}
        <Suspense fallback={<EventSkeleton />}>
          <EventContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function EventContent({ params }: { params: PageProps<"/[venue]/[event]">["params"] }) {
  const { venue: venueSlug, event: eventSlug } = await params;
  const catalog = await getEventCatalog(venueSlug, eventSlug);
  if (!catalog) notFound();
  const { venue, event } = catalog;
  const d = nightParts(event.startsAt);
  const tone = eventTone(event.slug);

  return (
    <div className="contents" style={{ "--tono": tone } as CSSProperties}>
      {/* El afiche de la fecha: la foto de la pista teñida con el color de la noche, y el título encima. */}
      <header className="ev-afiche entra relative isolate flex flex-col justify-end overflow-hidden rounded-[1.75rem] [grid-area:afiche]">
        {venue.flyerBackdrop && (
          // En su propia capa: Image con fill necesita un padre posicionado y el afiche es sticky en la compu.
          <div className="absolute inset-0 -z-30">
            <Image src={venue.flyerBackdrop} alt="" fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
        )}
        <div className="ev-afiche-tinte absolute inset-0 -z-20" aria-hidden />
        <div className="inf-grano -z-10" aria-hidden />
        <div className="p-5 sm:p-7">
          <p className="inf-titulo text-xs uppercase tracking-[0.2em] text-white/70">
            {d.weekday} {d.day} {d.monthLong}
          </p>
          <h1 className="inf-titulo mt-2 text-[clamp(2rem,8vw,3.6rem)] uppercase leading-[0.92] text-balance">{event.title}</h1>
          <p className="mt-3 text-white/80 sm:text-lg">{event.lineup.join(" · ")}</p>
          {/* En la compu la descripción va en el afiche, así la columna de la compra entra en la pantalla. */}
          <p className="mt-3 max-w-[30rem] text-sm text-white/65 text-pretty max-lg:hidden">{event.description}</p>
        </div>
      </header>

      <div className="flex flex-col gap-5 [grid-area:compra] lg:gap-4">
        {/* Los datos como el talón de una entrada impresa: una franja, sin íconos. */}
        <dl className="ev-franja entra" style={{ "--d": "120ms" } as CSSProperties}>
          <Dato label="Abre">
            {d.day} {d.month} · {d.time}
          </Dato>
          <Dato label="Lugar">
            {venue.mapsUrl ? (
              <a href={venue.mapsUrl} target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-4 hover:decoration-[var(--tono)]">
                {venue.name}
              </a>
            ) : (
              venue.name
            )}
          </Dato>
          <Dato label="Edad">+{event.ageLimit} · con DNI</Dato>
          <Dato label="Ingreso">{event.doorsNote}</Dato>
          {event.dressCode && <Dato label="Vestimenta">{event.dressCode}</Dato>}
        </dl>

        <section aria-labelledby="entradas">
          <h2 id="entradas" className="inf-titulo scroll-mt-24 text-xl sm:text-2xl">
            Entradas
          </h2>
          <TicketPicker venue={venue} event={event} />
        </section>

        <p className="max-w-[34rem] text-sm text-white/60 text-pretty lg:hidden">{event.description}</p>
      </div>
    </div>
  );
}

/** El color de cada noche, siempre el mismo para la misma fecha: celeste, magenta o violeta. */
function eventTone(slug: string) {
  const tones = ["#ee10b8", "#17b8f1", "#8b5cf6"];
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tones[h % tones.length];
}

/** Mientras llegan los datos: la misma grilla, con bloques en el lugar de cada cosa. */
function EventSkeleton() {
  const bloque = "animate-pulse rounded-xl bg-white/[0.06]";
  return (
    <>
      <div className={`${bloque} rounded-[1.75rem] [grid-area:afiche]`} aria-hidden />
      <section className="flex flex-col gap-5 [grid-area:compra]" aria-busy="true" aria-label="Cargando entradas">
        <div className={`${bloque} h-16`} />
        <h2 className="inf-titulo text-xl sm:text-2xl">Entradas</h2>
        <div className="flex flex-col gap-2">
          <div className={`${bloque} h-16`} />
          <div className={`${bloque} h-16`} />
        </div>
      </section>
    </>
  );
}

function Dato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</dt>
      <dd className="inf-titulo mt-1 text-[0.9rem] uppercase leading-snug text-pretty">{children}</dd>
    </div>
  );
}
