import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VenueLogo } from "@/components/venue-logo";
import { getVenueCatalog, venueParams } from "@/lib/catalog";
import { SITE, venueDatesHref, venueHref } from "@/lib/site";

export function generateStaticParams() {
  return venueParams();
}

const PILL =
  "mx-auto flex h-12 max-w-3xl items-center justify-between gap-2 rounded-full border border-white/10 bg-noche/60 pl-5 pr-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl";

/** Las páginas de cada boliche llevan su marca; la del sitio queda de fondo, en el pie. */
export default function VenueLayout({ children, params }: LayoutProps<"/[venue]">) {
  return (
    // El color de marca del boliche (--accent) lo define VenueNav, que sabe cuál es.
    <div className="venue-acento flex flex-1 flex-col">
      {/* Barra flotante, igual a la de la portada. */}
      <header className="sticky top-0 z-30 px-3 pt-3">
        {/*
          Qué boliche es sale de la URL: va dentro de Suspense para que, al navegar,
          la barra (vacía) y la página aparezcan al instante y el logo entre enseguida.
        */}
        <Suspense fallback={<div className={PILL} aria-hidden />}>
          <VenueNav params={params} />
        </Suspense>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="mt-auto flex items-center justify-center gap-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6 text-sm text-tenue lg:pb-5 lg:pt-3">
        Entradas con{" "}
        <Link href="/" className="font-semibold text-luz hover:underline">
          {SITE.name}
        </Link>
      </footer>
    </div>
  );
}

async function VenueNav({ params }: { params: LayoutProps<"/[venue]">["params"] }) {
  const catalog = await getVenueCatalog((await params).venue);
  if (!catalog) notFound();
  const { venue } = catalog;

  return (
    <nav aria-label={venue.name} className={PILL}>
      {/* El color de marca del boliche, para todo lo que cuelga de este layout. */}
      <style href={`acento-${venue.slug}`} precedence="default">{`.venue-acento{--accent:${venue.accent}}`}</style>
      <Link href={venueHref(venue.slug)} className="flex shrink-0 items-center" aria-label={`${venue.name}, inicio`}>
        <VenueLogo venue={venue} className="w-24 shrink-0 text-xl sm:w-28" glow={false} />
      </Link>
      <div className="flex items-center gap-1 text-sm">
        {venue.mapsUrl && (
          <a
            href={venue.mapsUrl}
            className="rounded-full px-3 py-2 text-white/75 transition-colors duration-200 hover:text-white max-sm:hidden"
            target="_blank"
            rel="noreferrer"
          >
            Cómo llegar
          </a>
        )}
        {venue.instagram && (
          <a
            href={`https://www.instagram.com/${venue.instagram}/`}
            aria-label={`Instagram de ${venue.name}`}
            className="grid size-9 place-items-center rounded-full text-white/75 transition-colors duration-200 hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" className="size-[1.125rem]" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
            </svg>
          </a>
        )}
        <Link
          href={venueDatesHref(venue.slug)}
          className="rounded-full bg-luz px-4 py-2 font-semibold text-noche transition-transform duration-200 ease-out active:scale-[0.97]"
        >
          Fechas
        </Link>
      </div>
    </nav>
  );
}
