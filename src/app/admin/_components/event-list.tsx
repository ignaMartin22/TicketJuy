"use client";

import Link from "next/link";
import { useState } from "react";
import { nightParts } from "@/lib/format";
import { isPast } from "../_lib/dates";
import { eventTotals, formatCount, hasSales } from "../_lib/stats";
import { deleteEvent, setSalesOpen, useAdminEvents, useHydrated } from "../_lib/store";
import type { AdminEvent } from "../_lib/types";
import { ConfirmDialog } from "./confirm-dialog";
import { PlusIcon, TrashIcon } from "./icons";
import { PanelLoading } from "./loading";
import { buttonClass, Card, EventThumb, PageHeader, SalesBar, StatusBadge } from "./ui";

type Filter = "upcoming" | "past";

export function EventList() {
  const events = useAdminEvents();
  const hydrated = useHydrated();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [toDelete, setToDelete] = useState<AdminEvent | null>(null);

  if (!hydrated) return <PanelLoading />;

  const upcoming = events.filter((e) => !isPast(e.startsAt));
  // Las pasadas, de la más reciente a la más vieja.
  const past = events.filter((e) => isPast(e.startsAt)).reverse();
  const shown = filter === "upcoming" ? upcoming : past;

  return (
    <>
      <PageHeader
        title="Eventos"
        description="Cargá fechas, editá precios y cupos, o pausá la venta."
        actions={
          <Link href="/admin/eventos/nuevo" className={buttonClass.primary}>
            <PlusIcon />
            Nuevo evento
          </Link>
        }
      />

      <div role="group" aria-label="Filtrar eventos" className="mt-8 inline-flex rounded-full border border-linea bg-noche-2 p-1 text-sm">
        {(
          [
            ["upcoming", `Próximos (${upcoming.length})`],
            ["past", `Finalizados (${past.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={`min-h-9 rounded-full px-4 font-medium transition-colors ${
              filter === value ? "bg-accent text-accent-foreground" : "text-tenue hover:text-luz"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card className="mt-4 p-6 text-tenue">
          {filter === "upcoming" ? (
            <>
              No hay fechas próximas.{" "}
              <Link href="/admin/eventos/nuevo" className="font-semibold text-accent hover:underline">
                Cargar un evento
              </Link>
            </>
          ) : (
            "Todavía no hay fechas finalizadas."
          )}
        </Card>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {shown.map((event) => (
            <EventRow key={event.slug} event={event} onDelete={() => setToDelete(event)} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={`¿Eliminar "${toDelete?.title ?? ""}"?`}
        body="La fecha deja de existir y no se puede recuperar."
        confirmLabel="Eliminar"
        onConfirm={() => toDelete && deleteEvent(toDelete.slug)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function EventRow({ event, onDelete }: { event: AdminEvent; onDelete: () => void }) {
  const total = eventTotals(event);
  const d = nightParts(event.startsAt);
  const past = isPast(event.startsAt);
  const sold = hasSales(event);

  return (
    <li>
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
        <Link
          href={`/admin/eventos/${event.slug}`}
          className="group flex min-w-0 flex-1 items-center gap-4"
        >
          <EventThumb event={event} className="size-16 sm:size-20" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold group-hover:text-accent">{event.title}</p>
              <StatusBadge event={event} />
            </div>
            <p className="mt-0.5 text-sm capitalize text-tenue">
              {d.weekday} {d.day} de {d.monthLong}, {d.time} h
            </p>
            <div className="mt-2 flex items-center gap-3 sm:max-w-xs">
              <div className="flex-1">
                <SalesBar sold={total.sold} capacity={total.capacity} label={`Vendidas de ${event.title}`} />
              </div>
              <span className="shrink-0 text-sm tabular-nums text-tenue">
                {formatCount(total.sold)} / {formatCount(total.capacity)}
              </span>
            </div>
          </div>
        </Link>

        <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
          <Link href={`/admin/eventos/${event.slug}/editar`} className={buttonClass.secondary}>
            Editar
          </Link>
          {!past && (
            <button
              type="button"
              className={buttonClass.secondary}
              onClick={() => setSalesOpen(event.slug, !event.salesOpen)}
            >
              {event.salesOpen ? "Pausar venta" : "Reanudar venta"}
            </button>
          )}
          {/* Con entradas vendidas no se elimina: se pausa la venta. */}
          {!sold && (
            <button
              type="button"
              className={`${buttonClass.danger} px-3`}
              onClick={onDelete}
              aria-label={`Eliminar ${event.title}`}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      </Card>
    </li>
  );
}
