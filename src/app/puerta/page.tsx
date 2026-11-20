import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import { doorEvents, doorVenues, getSession, type DoorEvent } from "@/lib/door";
import { nightParts } from "@/lib/format";
import { logout } from "./actions";

/** Esta noche: empieza en las próximas 16 h o empezó hace menos de 10 h. La página es dinámica (lee la sesión). */
function isTonight(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return diff < 16 * 3600_000 && diff > -10 * 3600_000;
}

export default function PuertaPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-noche-2" />}>
        <Content />
      </Suspense>
    </main>
  );
}

async function Content() {
  if (!hasLiveCatalog()) {
    return (
      <>
        <h1 className="display text-4xl">Portería</h1>
        <p className="mt-3 text-tenue">La portería necesita la API de entradas y acá no está configurada.</p>
      </>
    );
  }
  // Sin sesión, el proxy ya manda al ingreso; esto cubre una cookie que se borró en el medio.
  const session = await getSession();
  if (!session) redirect("/ingresar?desde=%2Fpuerta");

  const mine = await doorVenues(session);
  if (!mine.ok) {
    if (mine.reason === "expired") redirect("/puerta/sesion-vencida");
    return (
      <>
        <h1 className="display text-4xl">Portería</h1>
        <p className="mt-3 text-error">No pudimos cargar tus boliches. Recargá la página.</p>
      </>
    );
  }
  const venues = mine.data.venues;
  const rrpp = mine.data.rrpp;
  if (venues.length === 0) {
    return (
      <>
        <h1 className="display text-4xl">Portería</h1>
        <p className="mt-3 text-tenue">Tu usuario no tiene permiso de portería en ningún boliche.</p>
        {rrpp && (
          <Link href="/rrpp" className="mt-6 flex min-h-12 items-center justify-center rounded-full bg-luz px-5 text-base font-semibold text-noche">
            Mis listas
          </Link>
        )}
        <form action={logout} className="mt-6">
          <button type="submit" className="min-h-12 rounded-full border border-linea px-5 text-base font-semibold">
            Salir
          </button>
        </form>
      </>
    );
  }

  const lists = await Promise.all(venues.map((v) => doorEvents(session, v.slug)));
  if (lists.some((l) => !l.ok && l.reason === "expired")) redirect("/puerta/sesion-vencida");

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-tenue uppercase">Portería</p>
          <h1 className="display mt-1 text-4xl">Elegí la fecha</h1>
        </div>
        <div className="flex items-center gap-2">
          {rrpp && (
            <Link href="/rrpp" className="flex min-h-11 items-center rounded-full border border-linea px-4 text-sm font-semibold">
              Mis listas
            </Link>
          )}
          <form action={logout}>
            <button type="submit" className="min-h-11 rounded-full border border-linea px-4 text-sm font-semibold text-tenue">
              Salir
            </button>
          </form>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-8">
        {venues.map((venue, i) => {
          const list = lists[i];
          const events: DoorEvent[] = list.ok ? list.data : [];
          return (
            <section key={venue.slug}>
              {venues.length > 1 && <h2 className="mb-3 text-sm font-semibold tracking-wide text-tenue uppercase">{venue.name}</h2>}
              {!list.ok ? (
                <p className="text-error">No pudimos cargar las fechas. Recargá la página.</p>
              ) : events.length === 0 ? (
                <p className="text-tenue">No hay fechas publicadas.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {events.map((event) => {
                    const p = nightParts(event.startsAt);
                    const tonight = isTonight(event.startsAt);
                    return (
                      <li key={event.slug}>
                        <Link
                          href={`/puerta/${venue.slug}/${event.slug}`}
                          className={`panel flex items-center gap-4 rounded-2xl p-3 pr-4 transition-transform duration-150 active:scale-[0.98] ${tonight ? "puerta-hoy" : ""}`}
                        >
                          <span
                            className={`flex size-16 shrink-0 flex-col items-center justify-center rounded-xl leading-none ${tonight ? "bg-[var(--magenta)] text-white" : "bg-white/[0.06]"}`}
                          >
                            <span className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase opacity-80">{p.weekday.slice(0, 3)}</span>
                            <span className="display text-2xl tabular-nums">{p.day}</span>
                            <span className="text-[0.65rem] font-semibold tracking-[0.15em] uppercase opacity-80">{p.month.replace(".", "")}</span>
                          </span>
                          <span className="min-w-0 flex-1">
                            {tonight && (
                              <span className="mb-1 inline-block rounded-full bg-[var(--magenta)]/20 px-2 py-0.5 text-[0.7rem] font-bold tracking-[0.15em] text-[color-mix(in_oklab,var(--magenta)_60%,white)] uppercase">
                                Hoy
                              </span>
                            )}
                            <span className="block truncate text-lg font-semibold">{event.title}</span>
                            <span className="block text-sm text-tenue tabular-nums">Desde las {p.time} h</span>
                          </span>
                          <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-tenue" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
