"use client";

import Link from "next/link";
import { draftFromEvent, emptyDraft } from "../_lib/draft";
import { useHydrated } from "../_lib/store";
import { useEventFromUrl } from "../_lib/use-event-from-url";
import { EventForm } from "./event-form";
import { PanelLoading } from "./loading";
import { buttonClass, Card, PageHeader } from "./ui";

export function NewEventEditor() {
  // Esperamos al navegador: la validación de fechas usa la hora actual.
  if (!useHydrated()) return <PanelLoading />;
  return (
    <>
      <PageHeader title="Nuevo evento" description="Cargá la fecha, las entradas y la portada." />
      <EventForm initial={emptyDraft()} />
    </>
  );
}

export function EditEventEditor() {
  const { slug, hydrated, event } = useEventFromUrl();
  if (!hydrated) return <PanelLoading />;
  if (!event) return <EventNotFound />;
  return (
    <>
      <PageHeader title="Editar evento" description={event.title} />
      {/* key: si cambia el evento, el formulario arranca de cero. */}
      <EventForm key={slug} initial={draftFromEvent(event)} slug={slug} />
    </>
  );
}

export function EventNotFound() {
  return (
    <Card className="p-6">
      <h1 className="text-lg font-semibold">No encontramos este evento</h1>
      <p className="mt-1 text-tenue">Puede que se haya eliminado.</p>
      <Link href="/admin/eventos" className={`${buttonClass.secondary} mt-4`}>
        Volver a eventos
      </Link>
    </Card>
  );
}
