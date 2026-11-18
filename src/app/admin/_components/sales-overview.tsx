"use client";

import Link from "next/link";
import { formatPrice, nightParts } from "@/lib/format";
import { isPast } from "../_lib/dates";
import { eventTotals, formatCount, percent, sumTotals } from "../_lib/stats";
import { useAdminEvents, useHydrated } from "../_lib/store";
import { PlusIcon } from "./icons";
import { PanelLoading } from "./loading";
import { buttonClass, Card, EventThumb, PageHeader, SalesBar, StatCard, StatusBadge } from "./ui";

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

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Entradas vendidas"
          value={formatCount(all.sold)}
          hint={`de ${formatCount(all.capacity)} disponibles`}
        />
        <StatCard
          label="Recaudación"
          value={formatPrice(all.revenue)}
          hint="A precio de entrada"
        />
        <StatCard
          label="Ocupación"
          value={`${percent(all.sold, all.capacity)} %`}
          hint="Sobre el cupo total"
        />
        <StatCard
          label="VIP vendidas"
          value={formatCount(vip.sold)}
          hint={vip.capacity ? `de ${formatCount(vip.capacity)}` : "Sin VIP a la venta"}
        />
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
