"use client";

import Link from "next/link";
import { formatNight, formatPrice } from "@/lib/format";
import { isPast } from "../_lib/dates";
import { eventTotals, formatCount, percent } from "../_lib/stats";
import { setPublished, setSalesOpen } from "../_lib/store";
import { usePanelAction } from "../_lib/use-panel-action";
import { KIND_LABEL, type AdminEvent, type TicketKind } from "../_lib/types";
import { useEventFromUrl } from "../_lib/use-event-from-url";
import { EventNotFound } from "./event-editors";
import { ExternalIcon } from "./icons";
import { PanelLoading } from "./loading";
import { buttonClass, Card, EventThumb, SalesBar, StatCard, StatusBadge } from "./ui";

export function EventDetail() {
  const { hydrated, event } = useEventFromUrl();
  const action = usePanelAction();
  if (!hydrated) return <PanelLoading />;
  if (!event) return <EventNotFound />;

  const total = eventTotals(event);
  const past = isPast(event.startsAt);
  const isPublic = event.isPublished;

  return (
    <>
      <Link href="/admin/eventos" className="text-sm text-tenue hover:text-luz">
        ← Eventos
      </Link>
      <div className="mt-3">
        {/* Mismo look que PageHeader, pero con wrap: si las acciones no entran
            al lado del título, bajan completas debajo en vez de partirse. */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <h1 className="display text-4xl uppercase sm:text-5xl">{event.title}</h1>
            <p className="mt-2 text-tenue">
              <span className="flex flex-wrap items-center gap-2">
                <span className="inline-block first-letter:uppercase">{formatNight(event.startsAt)}</span>
                <StatusBadge event={event} />
              </span>
            </p>
          </div>
          <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
            {isPublic && (
              <Link
                href={`/${event.venueSlug}/${event.slug}`}
                className={`${buttonClass.secondary} flex-1 lg:flex-none`}
              >
                <ExternalIcon />
                Ver página
              </Link>
            )}
            {!past && (
              <button
                type="button"
                disabled={action.pending}
                className={`${event.isPublished ? buttonClass.secondary : buttonClass.primary} flex-1 lg:flex-none`}
                onClick={() => action.run(() => setPublished(event.slug, !event.isPublished))}
              >
                {event.isPublished ? "Pasar a borrador" : "Publicar"}
              </button>
            )}
            {!past && event.isPublished && (
              <button
                type="button"
                disabled={action.pending}
                className={`${buttonClass.secondary} flex-1 lg:flex-none`}
                onClick={() => action.run(() => setSalesOpen(event.slug, !event.salesOpen))}
              >
                {event.salesOpen ? "Pausar venta" : "Reanudar venta"}
              </button>
            )}
            <Link
              href={`/admin/eventos/${event.slug}/editar`}
              className={`${buttonClass.primary} flex-1 lg:flex-none`}
            >
              Editar
            </Link>
          </div>
        </div>
      </div>

      {!past && !event.isPublished && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-amber-200">
            Esta fecha es un borrador: no aparece en la web ni se puede comprar.
          </p>
          <button
            type="button"
            disabled={action.pending}
            className={buttonClass.primary}
            onClick={() => action.run(() => setPublished(event.slug, true))}
          >
            Publicar ahora
          </button>
        </div>
      )}

      {action.error && (
        <p role="alert" className="mt-6 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error">
          {action.error}
        </p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Vendidas" value={formatCount(total.sold)} hint={`de ${formatCount(total.capacity)}`} />
        <StatCard
          label="Disponibles"
          value={formatCount(total.capacity - total.sold)}
          hint={`${percent(total.sold, total.capacity)} % vendido`}
        />
        <StatCard label="Recaudación" value={formatPrice(total.revenue)} hint="A precio de entrada" />
        <StatCard
          label="Ticket promedio"
          value={total.sold ? formatPrice(Math.round(total.revenue / total.sold)) : "—"}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <Card className="overflow-hidden">
          <h2 className="border-b border-linea px-4 py-4 font-semibold sm:px-6">Ventas por tipo de entrada</h2>
          {(["general", "vip"] as const).map((kind) => (
            <KindBlock key={kind} kind={kind} event={event} />
          ))}
        </Card>

        <Card className="flex flex-col gap-4 p-4 sm:p-6">
          <EventThumb event={event} className="aspect-[4/5] w-full max-w-64 text-6xl" />
          <dl className="flex flex-col gap-3 text-sm">
            {event.lineup.length > 0 && <Info label="Artistas" value={event.lineup.join(", ")} />}
            {event.description && <Info label="Descripción" value={event.description} />}
            {event.doorsNote && <Info label="Ingreso" value={event.doorsNote} />}
            <Info label="Edad mínima" value={`+${event.ageLimit}`} />
            {event.dressCode && <Info label="Dress code" value={event.dressCode} />}
          </dl>
        </Card>
      </div>
    </>
  );
}

function KindBlock({ kind, event }: { kind: TicketKind; event: AdminEvent }) {
  const types = event.ticketTypes.filter((t) => t.kind === kind);
  if (types.length === 0) return null;
  const sub = eventTotals(event, kind);

  return (
    <section className="border-b border-linea px-4 py-4 last:border-0 sm:px-6">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-semibold">{KIND_LABEL[kind]}</h3>
        <p className="text-sm tabular-nums text-tenue">
          {formatCount(sub.sold)} / {formatCount(sub.capacity)} · {formatPrice(sub.revenue)}
        </p>
      </div>
      <ul className="mt-3 flex flex-col gap-4">
        {types.map((t) => (
          <li key={t.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <span>
                <span className="font-medium">{t.name}</span>{" "}
                <span className="text-tenue">· {formatPrice(t.price)}</span>
                {t.isActive === false && <span className="text-tenue"> · desactivada</span>}
              </span>
              <span className="tabular-nums">
                {formatCount(t.sold)} <span className="text-tenue">/ {formatCount(t.capacity)}</span>
              </span>
            </div>
            <div className="mt-2">
              <SalesBar sold={t.sold} capacity={t.capacity} label={`Vendidas de ${t.name}`} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-tenue">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}
