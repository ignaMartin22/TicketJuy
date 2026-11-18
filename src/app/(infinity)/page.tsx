import type { CSSProperties } from "react";
import Link from "next/link";
import { cheapestAvailable, events, tickets, venues } from "@/lib/mock-data";
import { formatPrice, nightParts, serviceFee } from "@/lib/format";
import { qrSvg } from "@/lib/qr";
import { HoloTicket } from "./_components/holo-ticket";
import { InfinityTrail } from "./_components/infinity-trail";
import { NightRings } from "./_components/night-rings";

// Portada de Infinity Producciones. Por ahora con datos de prueba (src/lib/mock-data.ts).

export default async function InfinityPrototype() {
  const proximas = events.slice(0, 3);
  const ticket = tickets[0];
  const evento = events.find((e) => e.slug === ticket.eventSlug)!;
  const tipo = evento.ticketTypes.find((t) => t.id === ticket.ticketTypeId)!;
  const d = nightParts(evento.startsAt);
  const qr = await qrSvg(ticket.code);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[color-mix(in_oklch,var(--inf-noche)_80%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/infinity/infinity-logo.svg" alt="Infinity Producciones" className="h-5" />
          <a href="#fechas" className="rounded-full bg-[var(--inf-luz)] px-4 py-2 text-sm font-semibold text-[var(--inf-noche)]">
            Entradas
          </a>
        </div>
      </header>

      <main className="flex flex-col">
        {/* 1. Portada con la estela del infinito */}
        <section className="relative isolate flex min-h-[86svh] bg-[var(--inf-noche)] flex-col items-center justify-center overflow-hidden px-4 py-14 text-center">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(70%_35%_at_30%_38%,#17b8f11c,transparent),radial-gradient(70%_35%_at_70%_38%,#ee10b81a,transparent)]" />
          <div className="inf-grano -z-10" />

          <div className="relative grid w-full place-items-center">
            {/* El ∞ de luz envuelve al logo. */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-[16/11] w-[min(125vw,52rem)] -translate-x-1/2 -translate-y-1/2">
              <InfinityTrail />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/infinity/infinity-logo.svg"
              alt="Infinity Producciones"
              className="inf-aparece my-[min(18vw,8rem)] w-[min(82vw,26rem)] drop-shadow-[0_0_24px_#ee10b855]"
              style={{ "--d": "150ms" } as CSSProperties}
            />
          </div>
          <h1 className="inf-titulo inf-aparece mt-8 text-4xl sm:text-6xl" style={{ "--d": "350ms" } as CSSProperties}>
            La noche que <span className="inf-degradado-texto">no termina</span>
          </h1>
          <p className="inf-aparece mt-3 max-w-sm text-[var(--inf-tenue)]" style={{ "--d": "500ms" } as CSSProperties}>
            Entradas para Moon, en San Salvador de Jujuy. Comprás en un minuto y te llega por WhatsApp.
          </p>
          <a
            href="#fechas"
            className="inf-borde-giro inf-aparece mt-8 inline-grid min-h-14 place-items-center px-8 text-lg font-semibold"
            style={{ "--d": "650ms" } as CSSProperties}
          >
            <span className="absolute inset-0 rounded-full bg-[var(--inf-noche)]" style={{ zIndex: -1 }} aria-hidden />
            Ver próximas fechas
          </a>
        </section>

        {/* 2. Próximas fechas como pósters */}
        <section id="fechas" className="mx-auto w-full max-w-5xl scroll-mt-16 px-4 py-14">
          <h2 className="inf-titulo text-3xl">Próximas fechas</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {proximas.map((e, i) => {
              const p = nightParts(e.startsAt);
              const base = cheapestAvailable(e);
              const moon = venues[0];
              // Precio final: con cargo de servicio si lo paga el comprador.
              const desde = base && (moon.feeMode === "buyer" ? base + serviceFee(base, moon.buyerFeeRate) : base);
              return (
                <li key={e.slug}>
                  <Link
                    href={`/moon/${e.slug}`}
                    className={`${i % 2 ? "inf-poster-b" : "inf-poster"} relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/10 p-5`}
                  >
                    <div className="inf-grano" />
                    <div className="relative flex items-start justify-between">
                      <div className="text-left">
                        <p className="inf-titulo text-5xl tabular-nums">{p.day}</p>
                        <p className="text-sm font-semibold capitalize">{p.month} · {p.weekday.slice(0, 3)}</p>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/brand/infinity/infinity-mark.svg" alt="" className="h-6 opacity-90" />
                    </div>
                    <div className="relative">
                      <p className="inf-titulo text-3xl uppercase leading-none">{e.title}</p>
                      <p className="mt-2 text-sm text-white/80">{e.lineup.join(" · ")}</p>
                      <p className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--inf-luz)] px-5 font-semibold text-[var(--inf-noche)]">
                        {desde ? `Desde ${formatPrice(desde)}` : "Agotada"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 3. Entrada holográfica */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14">
          <h2 className="inf-titulo text-3xl">Tu entrada</h2>
          <p className="mt-2 max-w-md text-[var(--inf-tenue)]">
            Un holograma que se mueve con el celu: se ve que es original, y el QR queda limpio para la puerta.
          </p>
          <div className="mt-8">
            <HoloTicket
              qr={qr}
              code={ticket.code}
              title={evento.title}
              when={`${d.weekday} ${d.day} ${d.month}, ${d.time} h`}
              holder={ticket.holderName}
              type={tipo.name}
            />
          </div>
        </section>

        {/* 4. Panel del dueño */}
        <section className="mx-auto w-full max-w-5xl px-4 py-14">
          <h2 className="inf-titulo text-3xl">
            Tu noche, <span className="inf-degradado-texto">en vivo</span>
          </h2>
          <p className="mt-2 max-w-md text-[var(--inf-tenue)]">
            Para el dueño: el símbolo de Infinity se llena con las entradas vendidas y la gente que ya entró.
          </p>
          <div className="mt-8 max-w-md">
            <NightRings />
          </div>
        </section>

      </main>

      <footer className="border-t border-white/5 px-4 py-10 text-center text-sm text-[var(--inf-tenue)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/infinity/infinity-mark.svg" alt="" className="mx-auto mb-3 h-6" />
        Infinity Producciones · San Salvador de Jujuy
      </footer>
    </>
  );
}
