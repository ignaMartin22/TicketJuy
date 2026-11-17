import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VenueLogo } from "@/components/venue-logo";
import { getVenue, venues } from "@/lib/mock-data";

export function generateStaticParams() {
  return venues.map((v) => ({ venue: v.slug }));
}

/** Las páginas de cada boliche llevan su marca; TicketJuy queda de fondo. */
export default async function VenueLayout({
  children,
  params,
}: LayoutProps<"/[venue]">) {
  const venue = getVenue((await params).venue);
  if (!venue) notFound();

  return (
    <div
      className="flex flex-1 flex-col"
      style={{ "--accent": venue.accent } as CSSProperties}
    >
      <header className="sticky top-0 z-30 border-b border-linea bg-noche/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href={`/${venue.slug}`} className="flex items-center">
            <VenueLogo venue={venue} className="w-24 text-3xl" glow={!venue.logo} />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {venue.mapsUrl && (
              <a
                href={venue.mapsUrl}
                className="text-tenue hover:text-luz"
                target="_blank"
                rel="noreferrer"
              >
                Cómo llegar
              </a>
            )}
            {venue.instagram && (
              <a
                href={`https://instagram.com/${venue.instagram}`}
                className="text-tenue hover:text-luz"
                target="_blank"
                rel="noreferrer"
              >
                @{venue.instagram}
              </a>
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="mt-auto flex items-center justify-center gap-2 py-8 text-xs text-tenue">
        <span className="neon-soft size-1.5 rounded-full bg-accent" aria-hidden />
        Entradas con{" "}
        <Link href="/" className="font-semibold text-luz hover:underline">
          TicketJuy
        </Link>
      </footer>
    </div>
  );
}
