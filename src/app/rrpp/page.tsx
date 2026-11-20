import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import { getSession } from "@/lib/door";
import { nightParts } from "@/lib/format";
import { isOpen, rrppLists, type PromoterList } from "@/lib/rrpp";
import { formatTime } from "../puerta/time";
import { logout } from "./actions";

export default function RrppPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <Suspense fallback={<div className="h-72 animate-pulse rounded-3xl bg-noche-2" />}>
        <Content />
      </Suspense>
    </main>
  );
}

/** Agrupa por fecha conservando el orden en que llegan (la API ya las manda por fecha). */
function byEvent(lists: PromoterList[]) {
  const groups = new Map<string, PromoterList[]>();
  for (const l of lists) {
    const key = `${l.event.venueSlug}/${l.event.slug}`;
    groups.set(key, [...(groups.get(key) ?? []), l]);
  }
  return [...groups.values()];
}

async function Content() {
  if (!hasLiveCatalog()) {
    return (
      <>
        <h1 className="display text-4xl">Mis listas</h1>
        <p className="mt-3 text-tenue">Las listas necesitan la API de entradas y acá no está configurada.</p>
      </>
    );
  }
  // Sin sesión, el proxy ya manda al ingreso; esto cubre una cookie que se borró en el medio.
  const session = await getSession();
  if (!session) redirect("/ingresar?desde=%2Frrpp");

  const r = await rrppLists(session);
  if (!r.ok && r.reason === "expired") redirect("/rrpp/sesion-vencida");

  const header = (
    <div className="flex items-start justify-between gap-4">
      <h1 className="display text-4xl">Mis listas</h1>
      <form action={logout}>
        <button type="submit" className="min-h-11 rounded-full border border-linea px-4 text-sm font-semibold text-tenue">
          Salir
        </button>
      </form>
    </div>
  );

  if (!r.ok) {
    return (
      <>
        {header}
        <p className="mt-6 text-error">No pudimos cargar tus listas. Recargá la página.</p>
      </>
    );
  }
  if (r.data.length === 0) {
    return (
      <>
        {header}
        <p className="mt-6 text-tenue">Todavía no tenés listas. Pedile al boliche que te arme una para la próxima fecha.</p>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="mt-8 flex flex-col gap-8">
        {byEvent(r.data).map((group) => {
          const event = group[0].event;
          const p = nightParts(event.startsAt);
          return (
            <section key={`${event.venueSlug}/${event.slug}`}>
              <h2 className="text-lg font-semibold">{event.title}</h2>
              <p className="mb-3 text-sm text-tenue first-letter:uppercase">
                {event.venueName} · {p.weekday} {p.day} de {p.monthLong}
              </p>
              <ul className="flex flex-col gap-3">
                {group.map((list) => {
                  const open = isOpen(list);
                  return (
                    <li key={list.id}>
                      <Link
                        href={`/rrpp/${encodeURIComponent(String(list.id))}`}
                        className={`panel flex min-h-16 items-center gap-4 rounded-2xl p-4 transition-transform duration-150 active:scale-[0.98] ${open ? "" : "opacity-60"}`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-lg font-semibold">{list.name}</span>
                          <span className="block text-sm tabular-nums">
                            {list.issued} de {list.quota} anotados · {list.admitted} ingresaron
                          </span>
                          <span className="block text-sm text-tenue tabular-nums">
                            {!list.isActive ? "Lista pausada" : open ? `Cierra a las ${formatTime(list.validUntil)}` : `Cerró a las ${formatTime(list.validUntil)}`}
                          </span>
                        </span>
                        <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-tenue" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
