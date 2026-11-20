import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import { doorEvents, doorVenues, getSession, type DoorEvent } from "@/lib/door";
import { formatNight } from "@/lib/format";
import { logout } from "./actions";

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
  const venues = mine.data;
  if (venues.length === 0) {
    return (
      <>
        <h1 className="display text-4xl">Portería</h1>
        <p className="mt-3 text-tenue">Tu usuario no tiene permiso de portería en ningún boliche.</p>
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
      <div className="flex items-center justify-between gap-4">
        <h1 className="display text-4xl">Elegí la fecha</h1>
        <form action={logout}>
          <button type="submit" className="min-h-12 rounded-full border border-linea px-5 text-base font-semibold">
            Salir
          </button>
        </form>
      </div>
      <div className="mt-6 flex flex-col gap-6">
        {venues.map((venue, i) => {
          const list = lists[i];
          const events: DoorEvent[] = list.ok ? list.data : [];
          return (
            <section key={venue.slug}>
              {venues.length > 1 && <h2 className="mb-3 font-semibold text-tenue">{venue.name}</h2>}
              {!list.ok ? (
                <p className="text-error">No pudimos cargar las fechas. Recargá la página.</p>
              ) : events.length === 0 ? (
                <p className="text-tenue">No hay fechas publicadas.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {events.map((event) => (
                    <li key={event.slug}>
                      <Link
                        href={`/puerta/${venue.slug}/${event.slug}`}
                        className="panel flex min-h-16 flex-col justify-center rounded-2xl px-5 py-3 active:scale-[0.99]"
                      >
                        <span className="font-semibold">{event.title}</span>
                        <span className="text-sm text-tenue first-letter:uppercase">{formatNight(event.startsAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
