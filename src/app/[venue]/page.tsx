import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DateBlock } from "@/components/date-block";
import { Flyer } from "@/components/flyer";
import { VenueLogo } from "@/components/venue-logo";
import { formatPrice } from "@/lib/format";
import { cheapestAvailable, getVenue, getVenueEvents, venues } from "@/lib/mock-data";

export async function generateMetadata({
  params,
}: PageProps<"/[venue]">): Promise<Metadata> {
  const venue = getVenue((await params).venue);
  return { title: venue ? `${venue.name}, próximas fechas` : "Boliche" };
}

export default async function VenuePage({ params }: PageProps<"/[venue]">) {
  const { venue: venueSlug } = await params;
  // El boliche principal tiene su portada en la raíz del sitio.
  if (venueSlug === venues[0].slug) redirect("/");
  const venue = getVenue(venueSlug);
  if (!venue) notFound();
  const events = getVenueEvents(venueSlug);
  const [featured, ...rest] = events;

  return (
    <main className="flex flex-col">
      {/* Portada del boliche: foto de la pista y logo encendido */}
      <section className="relative isolate overflow-hidden border-b border-linea">
        {venue.cover && (
          <Image
            src={venue.cover}
            alt=""
            fill
            priority
            sizes="100vw"
            className="zoom-portada -z-20 object-cover opacity-55 blur-[2px]"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-noche via-noche/60 to-noche/30" aria-hidden />
        <div className="mx-auto flex min-h-[22rem] max-w-5xl flex-col items-center justify-center px-4 py-14 text-center sm:min-h-[26rem] sm:px-6">
          <h1 className="sr-only">{venue.name}</h1>
          <div className="entra" style={{ "--d": "150ms" } as CSSProperties}>
            <VenueLogo venue={venue} priority className="neon-enciende w-[min(80vw,26rem)] text-[clamp(4rem,16vw,8rem)]" />
          </div>
          <p className="entra mt-6 text-tenue" style={{ "--d": "350ms" } as CSSProperties}>
            {venue.address !== venue.city ? `${venue.address}, ` : ""}
            {venue.city}
          </p>
          {venue.mapsUrl && (
            <a
              href={venue.mapsUrl}
              target="_blank"
              rel="noreferrer"
              style={{ "--d": "450ms" } as CSSProperties}
              className="entra mt-4 rounded-full border border-linea bg-noche/60 px-5 py-2.5 text-sm font-semibold backdrop-blur hover:border-accent/60"
            >
              Cómo llegar
            </a>
          )}
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">

      {!featured && (
        <p className="mt-10 rounded-2xl border border-dashed border-linea p-6 text-tenue">
          No hay fechas a la venta por ahora.
          {venue.instagram && ` Seguí a @${venue.instagram} para enterarte de la próxima.`}
        </p>
      )}

      {featured && (
        <Link
          href={`/${venue.slug}/${featured.slug}`}
          style={{ "--d": "550ms" } as CSSProperties}
          className="entra group mt-8 grid overflow-hidden rounded-[1.75rem] border border-linea bg-noche-2 transition-colors hover:border-accent/60 sm:grid-cols-[1.1fr_1fr]"
        >
          <Flyer event={featured} backdrop={venue.flyerBackdrop} className="aspect-[4/5] sm:aspect-auto sm:min-h-[26rem]" />
          <div className="flex flex-col justify-between gap-6 p-6">
            <div>
              <p className="text-sm font-semibold text-accent">La próxima</p>
              <div className="mt-4 flex items-start gap-4">
                <DateBlock iso={featured.startsAt} />
                <div>
                  <p className="text-lg font-semibold">{featured.title}</p>
                  <p className="mt-1 text-tenue">{featured.description}</p>
                </div>
              </div>
            </div>
            <PriceAndCta from={cheapestAvailable(featured)} />
          </div>
        </Link>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="mt-14 text-lg font-semibold">Más fechas</h2>
          <ul className="entra-lista mt-2 flex flex-col" style={{ "--d": "750ms" } as CSSProperties}>
            {rest.map((e) => (
              <li key={e.slug} className="border-t border-linea last:border-b">
                <Link
                  href={`/${venue.slug}/${e.slug}`}
                  className="group flex items-center gap-4 py-4"
                >
                  <DateBlock iso={e.startsAt} />
                  <Flyer
                    event={e}
                    backdrop={venue.flyerBackdrop}
                    size="sm"
                    className="hidden size-24 shrink-0 rounded-xl sm:flex [&_p:last-child]:hidden [&_p]:text-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="display text-xl uppercase text-balance group-hover:text-accent">
                      {e.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-tenue">
                      {e.lineup.join(", ")}
                    </p>
                  </div>
                  <Price from={cheapestAvailable(e)} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      </div>
    </main>
  );
}

function Price({ from }: { from: number | null }) {
  return (
    <p className="shrink-0 text-right text-sm">
      {from === null ? (
        <span className="text-tenue">Agotado</span>
      ) : (
        <>
          <span className="block text-tenue">desde</span>
          <span className="font-semibold">{formatPrice(from)}</span>
        </>
      )}
    </p>
  );
}

function PriceAndCta({ from }: { from: number | null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Price from={from} />
      <span className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground">
        {from === null ? "Ver fecha" : "Comprar entradas"}
      </span>
    </div>
  );
}
