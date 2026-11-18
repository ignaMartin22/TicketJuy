import { cheapestAvailable, events, venues } from "@/lib/mock-data";
import { formatPrice, nightParts, serviceFee } from "@/lib/format";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Countdown } from "./_components/countdown";
import { HeroRing } from "./_components/hero-ring";
import { HeroVideo } from "./_components/hero-video";
import { PhotoStack } from "./_components/photo-stack";

// Portada de Infinity Producciones. Por ahora con datos de prueba (src/lib/mock-data.ts).

export default function InfinityPrototype() {
  const fechas = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 4);
  // La próxima con entradas; si no queda ninguna, la primera.
  const proxima = fechas.find((e) => cheapestAvailable(e) !== null) ?? fechas[0];
  const pd = nightParts(proxima.startsAt);
  const ig = venues[0].instagram;
  const igUrl = `https://www.instagram.com/${ig}/`;

  return (
    <>
      {/* Barra flotante: no ocupa lugar, así la portada usa toda la pantalla. */}
      <header className="inf-baja fixed inset-x-0 top-0 z-30 px-3 pt-3">
        <nav
          aria-label="Infinity Producciones"
          className="mx-auto flex h-12 max-w-3xl items-center justify-between gap-2 rounded-full border border-white/10 bg-[color-mix(in_oklch,var(--inf-noche)_62%,transparent)] pl-5 pr-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          <Link href="/" aria-label="Infinity Producciones, inicio">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/infinity/infinity-logo.svg" alt="" className="h-4 sm:h-[1.125rem]" />
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <a href="#fechas-ancla" className="rounded-full px-3 py-2 text-white/75 transition-colors duration-200 hover:text-white max-sm:hidden">
              Fechas
            </a>
            <a href="#fotos" className="rounded-full px-3 py-2 text-white/75 transition-colors duration-200 hover:text-white max-sm:hidden">
              Fotos
            </a>
            {ig && (
              <a
                href={igUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram de Infinity"
                className="grid size-9 place-items-center rounded-full text-white/75 transition-colors duration-200 hover:text-white"
              >
                <InstagramIcon className="size-[1.125rem]" />
              </a>
            )}
            <a
              href="#fechas-ancla"
              className="rounded-full bg-[var(--inf-luz)] px-4 py-2 font-semibold text-[var(--inf-noche)] transition-transform duration-200 ease-out active:scale-[0.97]"
            >
              Entradas
            </a>
          </div>
        </nav>
      </header>

      <main className="flex flex-col">
        <HeroRing
          backdrop={venues[0].flyerBackdrop}
          background={<HeroVideo src="/venues/infinity/hero.mp4" poster="/venues/infinity/hero-poster.jpg" />}
          hero={
            <div className="mx-auto flex h-full max-w-6xl flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-20 sm:px-10 sm:pb-6 sm:pt-24">
              {/* En el celular: cartel arriba, la tarjeta en el medio y la cuenta regresiva abajo. */}
              <div className="flex flex-1 flex-col justify-between max-sm:items-center max-sm:text-center sm:justify-center">
                <div>
                  <h1 className="sr-only">Infinity Producciones</h1>
                  {/* El cartel de neón de la marca. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/infinity/infinity-logo.svg" alt="" className="inf-neon w-[min(82vw,36rem)]" />
                  <p className="inf-sube inf-eslogan mt-4 text-base text-white/80 sm:mt-5 sm:text-xl" style={{ "--d": "1500ms" } as CSSProperties}>
                    La noche que no termina.
                  </p>
                </div>

                {/* La próxima fecha y cuánto falta para que abra. */}
                <div
                  className="inf-sube sm:mt-12 sm:border-l-2 sm:border-[var(--inf-magenta)] sm:pl-5"
                  style={{ "--d": "1750ms" } as CSSProperties}
                >
                  <p className="text-sm text-white/65">
                    Próxima fecha: {pd.weekday} {pd.day} de {pd.monthLong}
                  </p>
                  <p className="inf-titulo mt-1 mb-3 text-lg sm:mb-4 sm:text-2xl">{proxima.title}</p>
                  <Countdown iso={proxima.startsAt} />
                </div>
              </div>

              {/* Todas las fechas de un vistazo, como el pie de un afiche. */}
              <ul className="grid grid-cols-4 gap-6 border-t border-white/15 pt-4 max-sm:hidden">
                {fechas.map((e, i) => {
                  const p = nightParts(e.startsAt);
                  return (
                    <li key={e.slug} className="inf-sube" style={{ "--d": `${2000 + i * 90}ms` } as CSSProperties}>
                      <Link href={`/${e.venueSlug}/${e.slug}`} className="group block">
                        <p className="text-sm capitalize tabular-nums text-white/65">
                          {p.weekday.slice(0, 3)} {p.day} {p.month}
                        </p>
                        <p className="inf-titulo mt-1 text-sm transition-colors duration-200 group-hover:text-[var(--inf-cian)]">
                          {e.title}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          }
          events={events.map((e, i) => {
            const p = nightParts(e.startsAt);
            const venue = venues.find((v) => v.slug === e.venueSlug)!;
            const base = cheapestAvailable(e);
            // Precio final: con cargo de servicio si lo paga el comprador.
            const desde = base && (venue.feeMode === "buyer" ? base + serviceFee(base, venue.buyerFeeRate) : base);
            const open = e.ticketTypes.find((t) => t.sold < t.capacity);
            const left = open ? open.capacity - open.sold : 0;
            return {
              slug: e.slug,
              href: `/${e.venueSlug}/${e.slug}`,
              title: e.title,
              lineup: e.lineup.join(", "),
              date: `${p.weekday.slice(0, 3)} ${p.day} ${p.month}`,
              time: p.time,
              from: desde ? formatPrice(desde) : null,
              tiers: e.ticketTypes.map((t) => ({ id: t.id, sold: t.sold / t.capacity })),
              stock: open
                ? `${open.name}: ${left <= open.capacity * 0.15 ? "últimas" : "quedan"} ${left}`
                : "No quedan entradas",
              tone: i % 2 ? "var(--inf-cian)" : "var(--inf-magenta)",
            };
          })}
        />

        <PhotoStack
          id="fotos"
          title="Así se vive la noche"
          text="Fotos de las últimas fechas. Bajá y se van sumando."
          photos={Array.from({ length: 9 }, (_, i) => `/venues/infinity/galeria/${String(i + 1).padStart(2, "0")}.jpg`)}
        />

        {/* Más fotos en Instagram: las mismas fotos de fondo, teñidas como la portada. */}
        {ig && (
          <section className="px-3 pb-20 sm:px-6 sm:pb-28">
            <a
              href={igUrl}
              target="_blank"
              rel="noreferrer"
              className="inf-revela group relative isolate mx-auto flex min-h-[22rem] max-w-6xl flex-col items-center justify-center overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:min-h-[26rem]"
            >
              <div className="absolute inset-0 -z-20 grid grid-cols-3 sm:grid-cols-5" aria-hidden>
                {[3, 5, 8, 2, 7].map((n, i) => (
                  <div key={n} className={`relative ${i > 2 ? "max-sm:hidden" : ""}`}>
                    <Image
                      src={`/venues/infinity/galeria/0${n}.jpg`}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 20vw, 34vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
              <div className="inf-insta-velo absolute inset-0 -z-10" aria-hidden />

              <InstagramIcon className="size-9" />
              <h2 className="inf-titulo mt-5 max-w-xl text-2xl text-balance sm:text-4xl">Las fotos de cada noche están en Instagram</h2>
              <p className="mt-3 text-white/80">@{ig}</p>
              <span className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[var(--inf-luz)] px-7 font-semibold text-[var(--inf-noche)] transition-transform duration-200 ease-out group-hover:scale-[1.04] group-active:scale-[0.97]">
                Ver más fotos
              </span>
            </a>
          </section>
        )}
      </main>

      <footer className="flex flex-col items-center border-t border-white/5 px-4 py-10 text-center text-sm text-[var(--inf-tenue)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/infinity/infinity-mark.svg" alt="" className="mx-auto mb-3 h-6" />
        Infinity Producciones · San Salvador de Jujuy
      </footer>
    </>
  );
}

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
    </svg>
  );
}
