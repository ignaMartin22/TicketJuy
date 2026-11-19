"use client";

import Link from "next/link";
import { formatPrice, nightParts } from "@/lib/format";
import { isPast } from "../_lib/dates";
import { eventTotals, formatCount, percent, sumTotals } from "../_lib/stats";
import { useAdminEvents, useHydrated } from "../_lib/store";
import { PlusIcon } from "./icons";
import { PanelLoading } from "./loading";
import { CIAN, HelioCard, MAGENTA, MoneyRows, SpokeRing, TickRows } from "./dash-charts";
import { buttonClass, Card, EventThumb, PageHeader, SalesBar, StatusBadge } from "./ui";

export function SalesOverview() {
  const events = useAdminEvents();
  const hydrated = useHydrated();
  if (!hydrated) return <PanelLoading />;

  const upcoming = events.filter((e) => !isPast(e.startsAt));
  const rows = upcoming.map((e) => ({
    event: e,
    total: eventTotals(e),
    general: eventTotals(e, "general"),
    vip: eventTotals(e, "vip"),
  }));
  const all = sumTotals(rows.map((r) => r.total));
  const vip = sumTotals(rows.map((r) => r.vip));
  // Lo que se recaudaría vendiendo todo el cupo, a precio de entrada.
  const potential = rows.reduce((acc, r) => acc + eventPotential(r.event), 0);

  return (
    <>
      <PageHeader
        title="Resumen"
        description="Entradas vendidas de las próximas fechas."
        actions={
          <Link href="/admin/eventos/nuevo" className={buttonClass.primary}>
            <PlusIcon />
            Nuevo evento
          </Link>
        }
      />

      {/* Tres tarjetas: cada una con un gráfico interactivo y dos números al pie. */}
      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <HelioCard
          title="Vendidas"
          subtitle="por fecha"
          badge={`${percent(all.sold, all.capacity)}% del cupo`}
          href="/admin/eventos"
          stats={[
            ["Vendidas", formatCount(all.sold)],
            ["Cupo", formatCount(all.capacity)],
          ]}
        >
          <TickRows
            rows={rows.map(({ event, total }) => {
              const d = nightParts(event.startsAt);
              return { title: event.title, date: `${d.day} ${d.month}`, sold: total.sold, capacity: total.capacity };
            })}
          />
        </HelioCard>

        <HelioCard
          title="Ocupación"
          subtitle="por tipo"
          badge={`${formatCount(vip.sold)} VIP`}
          href="/admin/eventos"
          stats={[
            ["Vendido", `${percent(all.sold, all.capacity)}%`],
            ["Libres", formatCount(all.capacity - all.sold)],
          ]}
        >
          <SpokeRing
            center={["Del cupo", `${percent(all.sold, all.capacity)}%`]}
            parts={[
              { label: "Común", value: all.sold - vip.sold, color: CIAN },
              { label: "VIP", value: vip.sold, color: MAGENTA },
              { label: "Libres", value: all.capacity - all.sold, color: "rest" },
            ]}
          />
        </HelioCard>

        <HelioCard
          title="Recaudación"
          subtitle="vs. potencial"
          badge={`${percent(all.revenue, potential)}%`}
          href="/admin/eventos"
          className="md:col-span-2 xl:col-span-1"
          stats={[
            ["Recaudado", formatCompact(all.revenue)],
            ["Potencial", formatCompact(potential)],
          ]}
        >
          <MoneyRows
            format={formatCompact}
            rows={rows.map(({ event, total }) => ({ title: event.title, value: total.revenue, max: eventPotential(event) }))}
          />
        </HelioCard>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-linea px-4 py-4 sm:px-6">
          <h2 className="font-semibold">Vendidas por evento</h2>
          <Link href="/admin/eventos" className="text-sm text-tenue hover:text-luz">
            Ver todos
          </Link>
        </div>

        {rows.length === 0 ? (
          <p className="p-6 text-tenue">
            No hay fechas próximas.{" "}
            <Link href="/admin/eventos/nuevo" className="font-semibold text-accent hover:underline">
              Cargá la primera
            </Link>
            .
          </p>
        ) : (
          <>
            {/* PC: tabla */}
            <table className="hidden w-full text-sm md:table">
              <thead className="text-left text-tenue">
                <tr className="border-b border-linea">
                  <th scope="col" className="px-6 py-3 font-medium">Evento</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Común</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">VIP</th>
                  <th scope="col" className="w-[22%] px-3 py-3 font-medium">Total</th>
                  <th scope="col" className="px-6 py-3 text-right font-medium">Recaudado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ event, total, general, vip }) => {
                  const d = nightParts(event.startsAt);
                  return (
                    <tr key={event.slug} className="border-b border-linea last:border-0 hover:bg-white/[0.02]">
                      <td className="px-6 py-3">
                        <Link href={`/admin/eventos/${event.slug}`} className="group flex items-center gap-3">
                          <EventThumb event={event} className="size-11" />
                          <span className="min-w-0">
                            <span className="block font-semibold group-hover:text-accent">{event.title}</span>
                            <span className="block capitalize text-tenue">
                              {d.weekday} {d.day} {d.month}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <Fraction {...general} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <Fraction {...vip} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <SalesBar sold={total.sold} capacity={total.capacity} label={`Vendidas de ${event.title}`} />
                          </div>
                          <span className="w-10 text-right tabular-nums text-tenue">
                            {percent(total.sold, total.capacity)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right font-semibold tabular-nums">
                        {formatPrice(total.revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Celular: tarjetas */}
            <ul className="divide-y divide-linea md:hidden">
              {rows.map(({ event, total, general, vip }) => {
                const d = nightParts(event.startsAt);
                return (
                  <li key={event.slug}>
                    <Link href={`/admin/eventos/${event.slug}`} className="block px-4 py-4">
                      <div className="flex items-center gap-3">
                        <EventThumb event={event} className="size-11" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{event.title}</p>
                          <p className="text-sm capitalize text-tenue">
                            {d.weekday} {d.day} {d.month}
                          </p>
                        </div>
                        <StatusBadge event={event} />
                      </div>
                      <div className="mt-3">
                        <SalesBar sold={total.sold} capacity={total.capacity} label={`Vendidas de ${event.title}`} />
                      </div>
                      <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <dt className="text-tenue">Común</dt>
                          <dd className="tabular-nums"><Fraction {...general} /></dd>
                        </div>
                        <div>
                          <dt className="text-tenue">VIP</dt>
                          <dd className="tabular-nums"><Fraction {...vip} /></dd>
                        </div>
                        <div className="text-right">
                          <dt className="text-tenue">Recaudado</dt>
                          <dd className="font-semibold tabular-nums">{formatPrice(total.revenue)}</dd>
                        </div>
                      </dl>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}

/** "271 / 300", o una raya si ese tipo no existe en la fecha. */
function Fraction({ sold, capacity }: { sold: number; capacity: number }) {
  if (capacity === 0) return <span className="text-tenue">—</span>;
  return (
    <>
      {formatCount(sold)} <span className="text-tenue">/ {formatCount(capacity)}</span>
    </>
  );
}

/** Lo que recaudaría la fecha vendiendo todo el cupo. */
function eventPotential(event: { ticketTypes: { capacity: number; price: number }[] }) {
  return event.ticketTypes.reduce((acc, t) => acc + t.capacity * t.price, 0);
}

/** "$ 14,3 M", "$ 936 mil": montos cortos para las tarjetas. */
function formatCompact(n: number) {
  if (n >= 1_000_000) return `$ ${(n / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000) return `$ ${Math.round(n / 1_000).toLocaleString("es-AR")} mil`;
  return formatPrice(n);
}
