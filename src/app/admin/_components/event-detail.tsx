"use client";

import Link from "next/link";
import { formatNight, formatPrice } from "@/lib/format";
import { getEvent } from "@/lib/mock-data";
import { isPast } from "../_lib/dates";
import { eventTotals, formatCount, percent } from "../_lib/stats";
import { ADMIN_VENUE_SLUG, setSalesOpen } from "../_lib/store";
import { KIND_LABEL, type AdminEvent, type TicketKind } from "../_lib/types";
import { useEventFromUrl } from "../_lib/use-event-from-url";
import { EventNotFound } from "./event-editors";
import { ExternalIcon } from "./icons";
import { PanelLoading } from "./loading";
import { buttonClass, Card, EventThumb, PageHeader, SalesBar, StatCard, StatusBadge } from "./ui";

export function EventDetail() {
  const { hydrated, event } = useEventFromUrl();
  if (!hydrated) return <PanelLoading />;
  if (!event) return <EventNotFound />;

  const total = eventTotals(event);
  const past = isPast(event.startsAt);
  // PROVISORIO: la página pública todavía lee los datos de prueba, no los del panel.
  const isPublic = Boolean(getEvent(ADMIN_VENUE_SLUG, event.slug));

  return (
    <>
      <Link href="/admin/eventos" className="text-sm text-tenue hover:text-luz">
        ← Eventos
      </Link>
      <div className="mt-3">
        <PageHeader
          title={event.title}
          description={
            <span className="flex flex-wrap items-center gap-2">
              <span className="inline-block first-letter:uppercase">{formatNight(event.startsAt)}</span>
              <StatusBadge event={event} />
            </span>
          }
          actions={
            <>
              {isPublic && (
                <Link href={`/${event.venueSlug}/${event.slug}`} className={buttonClass.secondary}>
                  <ExternalIcon />
                  Ver página
                </Link>
              )}
              {!past && (
                <button
                  type="button"
                  className={buttonClass.secondary}
                  onClick={() => setSalesOpen(event.slug, !event.salesOpen)}
                >
                  {event.salesOpen ? "Pausar venta" : "Reanudar venta"}
                </button>
              )}
              <Link href={`/admin/eventos/${event.slug}/editar`} className={buttonClass.primary}>
                Editar
              </Link>
            </>
          }
        />
      </div>

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
