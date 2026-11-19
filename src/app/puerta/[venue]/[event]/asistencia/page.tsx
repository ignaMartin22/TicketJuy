import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import { doorAttendance, getSession } from "@/lib/door";
import { formatNight } from "@/lib/format";
import { AttendanceList } from "./attendance-list";

export default function AttendancePage({ params }: PageProps<"/puerta/[venue]/[event]/asistencia">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-6 sm:px-6">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-noche-2" />}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: { params: PageProps<"/puerta/[venue]/[event]/asistencia">["params"] }) {
  const { venue, event } = await params;
  if (!hasLiveCatalog()) redirect("/puerta");
  const session = await getSession();
  if (!session) redirect("/puerta");
  const r = await doorAttendance(session, venue, event);
  if (!r.ok) {
    if (r.reason === "expired") redirect("/puerta/sesion-vencida");
    if (r.reason === "not_found") notFound();
    return <p className="text-error">No pudimos cargar la asistencia. Recargá la página.</p>;
  }
  const a = r.data;
  return (
    <>
      <Link
        href={`/puerta/${venue}/${event}`}
        className="inline-flex min-h-12 items-center rounded-full border border-linea px-5 font-semibold"
      >
        Volver al escáner
      </Link>
      <h1 className="display mt-5 text-3xl">{a.event.title}</h1>
      <p className="text-sm text-tenue first-letter:uppercase">{formatNight(a.event.startsAt)}</p>
      <p className="display mt-5 text-4xl tabular-nums">
        Ingresaron {a.admitted} de {a.issued}
      </p>
      {a.ticketTypes.length > 0 && (
        <ul className="panel mt-4 flex flex-col gap-2 rounded-2xl p-4">
          {a.ticketTypes.map((t) => (
            <li key={t.id} className="flex justify-between gap-4">
              <span>{t.name}</span>
              <span className="tabular-nums text-tenue">
                {t.admitted} de {t.issued}
              </span>
            </li>
          ))}
        </ul>
      )}
      <AttendanceList tickets={a.tickets} />
    </>
  );
}
