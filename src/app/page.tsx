import { Suspense, type CSSProperties } from "react";
import { getVenueCatalog } from "@/lib/catalog";
import Image from "next/image";
import Link from "next/link";
import { DateBlock } from "@/components/date-block";
import { HeroCard } from "@/components/hero-card";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { TicketStub } from "@/components/ticket-stub";
import { VenueLogo } from "@/components/venue-logo";
import { formatPrice, nightParts } from "@/lib/format";
import {
  cheapestAvailable,
  getEvent,
  getTicket,
  getVenue,
} from "@/lib/mock-data";
import { qrSvg } from "@/lib/qr";
import { whatsappLink } from "@/lib/site";

const CHANNELS = [
  {
    channel: "Online",
    today: "Una ticketera nacional distinta según la fecha, con su propio panel y su liquidación.",
    with: "Tu página de venta, con tu marca, en un link.",
  },
  {
    channel: "Instagram",
    today: "Transferencias que alguien revisa a mano en el celular.",
    with: "El link de la bio lleva directo a pagar. La entrada llega por WhatsApp.",
  },
  {
    channel: "Punto de venta",
    today: "Talonario y planilla.",
    with: "Se carga en el mismo sistema y descuenta del mismo cupo.",
  },
  {
    channel: "Puerta",
    today: "Efectivo y QR sueltos, sin registro.",
    with: "Escáner en el celular del personal, que anda sin señal.",
  },
];

const FIRST_VERSION = [
  ["Checkout sin cuenta", "El comprador paga en dos toques desde el link de Instagram."],
  ["Entrada con QR de un solo uso", "Llega por WhatsApp y email. Una entrada, un ingreso."],
  ["Escáner sin señal", "Valida en la puerta aunque se caiga el 4G a la 1:30."],
  ["Panel del boliche", "Ventas, plata e ingresos de cada fecha en tiempo real."],
  ["Varios tipos de entrada", "Tandas, VIP y packs, cada uno con su cupo."],
];

const NEXT_STAGE = [
  "Códigos de RRPP con ranking en vivo y comisión automática",
  "Mesas VIP con mapa y seña online",
  "Listas free y de cumpleaños que maneja el cumpleañero",
  "Venta en caja y puerta dentro del mismo sistema",
  "Transferir entradas entre personas, sin reventa",
];

export default function Landing() {
  return <Suspense fallback={null}><LandingContent /></Suspense>;
}

async function LandingContent() {
  const sample = getTicket("TJ-7K3M-Q9XA")!;
  const venue = getVenue(sample.venueSlug)!;
  const event = getEvent(sample.venueSlug, sample.eventSlug)!;
  const type = event.ticketTypes.find((t) => t.id === sample.ticketTypeId)!;
  const qr = await qrSvg(sample.code);
  const moonCatalog = await getVenueCatalog("moon");
  const moon = moonCatalog?.venue ?? getVenue("moon")!;
  const moonEvents = moonCatalog?.events ?? [];
  const contact = whatsappLink("Hola, quiero vender las entradas de mi boliche con TicketJuy.");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Portada: tarjeta de vidrio sobre la pista de Moon */}
        <section className="relative isolate overflow-hidden px-3 pb-24 pt-4 sm:px-6 sm:pt-8">
          {/* Fondo: la gente en la pista, desenfocada y oscurecida */}
          {moon.flyerBackdrop && (
            <Image
              src={moon.flyerBackdrop}
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-30 scale-110 object-cover opacity-75 blur-md"
            />
          )}
          <div className="absolute inset-0 -z-20 bg-gradient-to-b from-noche/30 via-noche/55 to-noche" aria-hidden />
          {/* Láseres de boliche */}
          <div className="absolute inset-0 -z-10 max-lg:opacity-35" aria-hidden>
            <span className="laser laser-a" style={{ left: "62%" }} />
            <span className="laser laser-b" style={{ left: "82%" }} />
            <span className="laser laser-c" style={{ left: "22%", opacity: 0.3 }} />
          </div>

          <HeroCard className="mx-auto max-w-6xl rounded-[2rem] sm:rounded-[2.5rem]">
            <div className="grid items-center gap-10 px-5 pb-8 pt-10 sm:px-10 lg:grid-cols-[1.15fr_1fr] lg:pb-14 lg:pt-16">
              <div>
                <h1 className="display text-[clamp(3.4rem,10vw,7rem)] uppercase">
                  Todas las entradas de tu boliche,{" "}
                  <span className="neon-enciende inline-block">
                    <span className="neon-text neon-falla-texto">en un solo lugar.</span>
                  </span>
                </h1>
                <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-tenue">
                  Online, Instagram, caja y puerta en el mismo sistema. Cada venta
                  entra directo a tu Mercado Pago y pagás solo por lo que vendés.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#sumate"
                    className="neon-soft rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground"
                  >
                    Sumar mi boliche
                  </a>
                  <Link
                    href={`/${venue.slug}/${event.slug}`}
                    className="rounded-full border border-white/15 bg-white/5 px-6 py-3.5 font-semibold hover:border-luz/40"
                  >
                    Ver cómo compra la gente
                  </Link>
                </div>
              </div>

              {/* La entrada, flotando dentro de la tarjeta */}
              <div className="relative flex justify-center">
                <div className="halo halo-late absolute left-1/2 top-1/2 aspect-square w-[140%] -translate-x-1/2 -translate-y-1/2" aria-hidden />
                <div className="flotar relative w-full max-w-[22rem]">
                  <div className="entrada-aparece anillo-neon -rotate-3 rounded-[1.75rem]">
                    {/* Brillo del tubo, que falla de a ratos */}
                    <div className="neon neon-falla pointer-events-none absolute inset-0 rounded-[inherit]" aria-hidden />
                    <TicketStub
                      venue={venue}
                      event={event}
                      type={type}
                      ticket={sample}
                      qr={qr}
                      live
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cinta con las próximas fechas de Moon */}
            {moonEvents.length > 0 && <Link
              href={`/${moon.slug}`}
              className="block overflow-hidden rounded-b-[inherit] border-t border-white/10 bg-black/30 py-3.5"
              aria-label="Ver las próximas fechas de Moon"
            >
              <div className="marquesina" aria-hidden>
                {[0, 1].map((copy) => (
                  <div key={copy} className="flex shrink-0 items-center">
                    {moonEvents.concat(moonEvents).map((e, i) => {
                      const d = nightParts(e.startsAt);
                      return (
                        <span key={`${copy}-${i}`} className="flex items-center whitespace-nowrap">
                          <span className="display px-6 text-2xl uppercase">
                            {e.title}
                          </span>
                          <span className="text-sm capitalize text-tenue">
                            {d.weekday} {d.day} {d.month}, Moon
                          </span>
                          <span className="neon-text px-6 text-lg">✦</span>
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Link>}
          </HeroCard>
        </section>

        {/* Moon */}
        <section
          id="moon"
          className="relative isolate scroll-mt-16 overflow-hidden border-t border-linea"
          style={{ "--accent": moon.accent } as CSSProperties}
        >
          <div className="halo absolute -left-40 top-0 -z-10 size-[40rem]" aria-hidden />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div className="revelar relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-[1.75rem] border border-linea p-7">
              {moon.cover && (
                <Image
                  src={moon.cover}
                  alt="Las luces y los carteles de neón de Moon"
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="-z-20 object-cover opacity-70"
                />
              )}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-noche via-noche/55 to-transparent" aria-hidden />
              <h2 className="sr-only">{moon.name}</h2>
              <VenueLogo venue={moon} className="w-[min(70vw,18rem)] text-[clamp(5rem,18vw,8rem)]" />
              <p className="mt-4 text-lg text-tenue">
                {moon.city}. Consultá las próximas fechas.
              </p>
              {moonCatalog && <Link
                href={`/${moon.slug}`}
                className="neon-soft mt-8 self-start rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground"
              >
                Ver todas las fechas
              </Link>}
            </div>

            <ul className="revelar-hijos flex flex-col">
              {moonEvents.slice(0, 3).map((e) => {
                const from = cheapestAvailable(e);
                return (
                  <li key={e.slug} className="border-t border-linea last:border-b">
                    <Link
                      href={`/${moon.slug}/${e.slug}`}
                      className="group flex items-center gap-4 py-5 sm:gap-8"
                    >
                      <DateBlock iso={e.startsAt} />
                      <div className="min-w-0 flex-1">
                        <p className="display text-3xl uppercase text-balance group-hover:text-accent sm:text-4xl">
                          {e.title}
                        </p>
                        <p className="mt-1 text-sm text-tenue">{e.lineup.join(", ")}</p>
                      </div>
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
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Hoy vs con TicketJuy */}
        <section className="border-t border-linea bg-noche-2">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="revelar-titulo display max-w-3xl text-6xl uppercase">
              Cuatro canales, un mismo cupo
            </h2>
            <p className="revelar mt-4 max-w-[36rem] text-tenue">
              Hoy cada canal se controla por separado. Con TicketJuy todo
              descuenta del mismo cupo y aparece en el mismo panel.
            </p>
            <div className="revelar-hijos mt-10 overflow-hidden rounded-2xl border border-linea">
              <div className="hidden grid-cols-[10rem_1fr_1fr] bg-noche-3 text-sm text-tenue sm:grid">
                <p className="px-5 py-3">Canal</p>
                <p className="px-5 py-3">Hoy</p>
                <p className="px-5 py-3 text-accent">Con TicketJuy</p>
              </div>
              {CHANNELS.map((c) => (
                <div
                  key={c.channel}
                  className="grid gap-2 border-t border-linea px-5 py-5 first:border-t-0 sm:grid-cols-[10rem_1fr_1fr] sm:gap-0 sm:px-0 sm:first:border-t"
                >
                  <p className="font-semibold sm:px-5">{c.channel}</p>
                  <p className="text-tenue sm:px-5">
                    <span className="font-medium sm:hidden">Hoy: </span>
                    {c.today}
                  </p>
                  <p className="sm:px-5">
                    <span className="font-medium text-accent sm:hidden">Con TicketJuy: </span>
                    {c.with}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo llega la plata */}
        <section id="como-funciona" className="scroll-mt-16">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <h2 className="revelar-titulo display text-6xl uppercase">La plata no pasa por nosotros</h2>
              <p className="revelar mt-4 max-w-[34rem] text-tenue">
                Conectás tu cuenta de Mercado Pago una vez. Desde ahí, cada
                entrada se cobra en tu cuenta y nuestra comisión se separa sola
                en el mismo pago. Cargar fechas y cupos no cuesta nada.
              </p>
            </div>
            <ol className="revelar-hijos flex flex-col">
              {[
                ["El comprador paga", "Con Mercado Pago, desde el link de tu Instagram."],
                ["La plata entra a tu cuenta", "Mercado Pago la acredita en tu cuenta, no en la nuestra."],
                ["La comisión se separa sola", "Nuestra parte se descuenta en el mismo pago. Sin facturas aparte ni transferencias a fin de mes."],
              ].map(([title, body], i) => (
                <li key={title} className="flex gap-5 border-t border-linea py-6 last:border-b">
                  <span className="display w-10 shrink-0 text-5xl text-accent">{i + 1}</span>
                  <div>
                    <p className="text-lg font-semibold">{title}</p>
                    <p className="mt-1 text-tenue">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Qué incluye */}
        <section className="border-t border-linea bg-noche-2">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h2 className="revelar-titulo display text-6xl uppercase">Hecho para un sábado a la noche</h2>
              <dl className="revelar-hijos mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {FIRST_VERSION.map(([title, body]) => (
                  <div key={title}>
                    <dt className="font-semibold">{title}</dt>
                    <dd className="mt-1 text-tenue">{body}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="revelar self-start rounded-2xl border border-dashed border-linea p-6">
              <p className="font-semibold">Lo que viene después</p>
              <ul className="mt-4 flex flex-col gap-3 text-tenue">
                {NEXT_STAGE.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="sumate" className="scroll-mt-16 px-4 pb-20 sm:px-6">
          <div className="revelar neon relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-noche-2 px-6 py-14 sm:px-12">
            <div className="halo absolute -right-40 -top-40 -z-10 size-[36rem]" aria-hidden />
            <h2 className="revelar-titulo display max-w-3xl text-6xl uppercase sm:text-7xl">
              Cargá tu próxima fecha gratis
            </h2>
            <p className="mt-4 max-w-[34rem] text-lg text-tenue">
              Te ayudamos a conectar Mercado Pago y armar la primera fecha. Las
              noches de evento estamos en la puerta y por WhatsApp.
            </p>
            {contact ? (
              <a
                href={contact}
                target="_blank"
                rel="noreferrer"
                className="neon-soft mt-8 inline-block rounded-full bg-accent px-6 py-3.5 font-semibold text-accent-foreground"
              >
                Escribinos por WhatsApp
              </a>
            ) : (
              <p className="mt-8 inline-block rounded-full border border-dashed border-linea px-6 py-3.5 text-tenue">
                Falta cargar el WhatsApp de contacto en src/lib/site.ts
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
