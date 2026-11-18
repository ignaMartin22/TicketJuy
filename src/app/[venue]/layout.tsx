import { Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VenueLogo } from "@/components/venue-logo";
import { getVenueCatalog } from "@/lib/catalog";
import { venues } from "@/lib/mock-data";

export function generateStaticParams() {
  return venues.map((v) => ({ venue: v.slug }));
}

/** Las páginas de cada boliche llevan su marca; Infinity Producciones queda de fondo. */
export default function VenueLayout(props: LayoutProps<"/[venue]">) {
  return <Suspense fallback={null}><VenueContent {...props} /></Suspense>;
}

async function VenueContent({
  children,
  params,
}: LayoutProps<"/[venue]">) {
  const catalog = await getVenueCatalog((await params).venue);
  if (!catalog) notFound();
  const { venue } = catalog;

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
          <div className="flex items-center gap-3 text-sm">
            {venue.mapsUrl && (
              <a
                href={venue.mapsUrl}
                className="py-2 text-tenue hover:text-luz"
                target="_blank"
                rel="noreferrer"
              >
                Cómo llegar
              </a>
            )}
            {venue.instagram && (
              <a
                href={`https://instagram.com/${venue.instagram}`}
                className="py-2 text-tenue hover:text-luz"
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
      <footer className="mt-auto flex items-center justify-center gap-2 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-8 text-sm text-tenue">
        <span className="neon-soft size-1.5 rounded-full bg-accent" aria-hidden />
        Entradas con{" "}
        <Link href="/" className="font-semibold text-luz hover:underline">
          Infinity Producciones
        </Link>
      </footer>
    </div>
  );
}
