import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import { doorEvents, getSession, type DoorEvent } from "@/lib/door";
import { formatNight } from "@/lib/format";
import { logout } from "./actions";
import { LoginForm } from "./login-form";

export default function PuertaPage({ searchParams }: PageProps<"/puerta">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-noche-2" />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/puerta">["searchParams"] }) {
  if (!hasLiveCatalog()) {
    return (
      <>
        <h1 className="display text-4xl">Portería</h1>
        <p className="mt-3 text-tenue">La portería necesita la API de entradas y acá no está configurada.</p>
      </>
    );
  }
  const session = await getSession();
  if (!session) {
    const { vencida } = await searchParams;
    return (
      <>
        <h1 className="display text-4xl">Portería</h1>
        <p className="mt-2 text-tenue">Entrá con tu usuario de puerta.</p>
        <LoginForm notice={vencida ? "La sesión venció. Entrá de nuevo." : undefined} />
      </>
    );
  }

  const lists = await Promise.all(session.venues.map((v) => doorEvents(session, v.slug)));
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
        {session.venues.map((venue, i) => {
          const list = lists[i];
          const events: DoorEvent[] = list.ok ? list.data : [];
          return (
            <section key={venue.slug}>
              {session.venues.length > 1 && <h2 className="mb-3 font-semibold text-tenue">{venue.name}</h2>}
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
