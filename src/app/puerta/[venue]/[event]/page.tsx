import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import { doorAttendance, getSession } from "@/lib/door";
import { Scanner } from "./scanner";

export default function ScanPage({ params }: PageProps<"/puerta/[venue]/[event]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh animate-pulse bg-noche-2" />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/puerta/[venue]/[event]">["params"] }) {
  const { venue, event } = await params;
  if (!hasLiveCatalog()) redirect("/puerta");
  const session = await getSession();
  if (!session) redirect("/puerta");
  const r = await doorAttendance(session, venue, event);
  if (!r.ok) {
    if (r.reason === "expired") redirect("/puerta/sesion-vencida");
    if (r.reason === "not_found") notFound();
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <p className="text-error">No pudimos cargar la fecha. Recargá la página.</p>
      </main>
    );
  }
  return (
    <Scanner
      venue={venue}
      event={event}
      title={r.data.event.title}
      initial={{ admitted: r.data.admitted, issued: r.data.issued }}
    />
  );
}
