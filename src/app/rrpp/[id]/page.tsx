import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import { getSession } from "@/lib/door";
import { isOpen, rrppList } from "@/lib/rrpp";
import { GuestBoard } from "./guest-board";

export default function ListPage({ params }: PageProps<"/rrpp/[id]">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10">
      <Link href="/rrpp" className="inline-flex min-h-11 items-center text-sm text-tenue hover:text-luz">
        ← Mis listas
      </Link>
      <Suspense fallback={<div className="mt-3 h-72 animate-pulse rounded-3xl bg-noche-2" />}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: { params: PageProps<"/rrpp/[id]">["params"] }) {
  const { id } = await params;
  if (!hasLiveCatalog()) redirect("/rrpp");
  const session = await getSession();
  if (!session) redirect("/ingresar?desde=%2Frrpp");
  const r = await rrppList(session, id);
  if (!r.ok) {
    if (r.reason === "expired") redirect("/rrpp/sesion-vencida");
    if (r.reason === "not_found") notFound();
    return <p className="mt-3 text-error">No pudimos cargar la lista. Recargá la página.</p>;
  }
  return <GuestBoard id={id} initialList={r.data.list} initialClosed={!isOpen(r.data.list)} initialGuests={[...r.data.guests].sort((a, b) => b.addedAt.localeCompare(a.addedAt))} />;
}
