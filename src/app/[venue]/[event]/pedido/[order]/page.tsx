import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventCatalog, hasLiveCatalog } from "@/lib/catalog";
import { formatNight, formatPrice } from "@/lib/format";
import { getOrder } from "@/lib/orders";
import { ReservationTimer } from "./reservation-timer";

export const metadata: Metadata = {
  title: "Tu reserva",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Pedido reservado en ticketera-core, esperando el pago. */
export default function OrderPage({ params }: PageProps<"/[venue]/[event]/pedido/[order]">) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-noche-2" />}>
        <OrderContent params={params} />
      </Suspense>
    </main>
  );
}

async function OrderContent({ params }: { params: PageProps<"/[venue]/[event]/pedido/[order]">["params"] }) {
  const { venue: venueSlug, event: eventSlug, order: orderId } = await params;
  if (!hasLiveCatalog() || !UUID.test(orderId)) notFound();
  const [catalog, order] = await Promise.all([
    getEventCatalog(venueSlug, eventSlug),
    getOrder(venueSlug, eventSlug, orderId),
  ]);
  if (!catalog || !order) notFound();
  const { event } = catalog;
  const names = new Map(event.ticketTypes.map((t) => [t.id, t.name]));
  const fees = order.items.reduce((s, i) => s + Number(i.unitServiceFee) * i.quantity, 0);
  const backHref = `/${venueSlug}/${eventSlug}`;
  const expired = order.status === "expired";

  return (
    <>
      <h1 className="display text-4xl sm:text-5xl">{expired ? "La reserva venció" : "Reservamos tus entradas"}</h1>
      <p className="mt-2 text-tenue">
        {expired
          ? "Pasaron los 10 minutos y el cupo se liberó. Podés volver a elegir tus entradas."
          : "Las guardamos a tu nombre mientras completás el pago."}
      </p>

      <section className="panel mt-6 rounded-3xl p-5">
        <p className="font-semibold">{event.title}</p>
        <p className="text-sm text-tenue first-letter:uppercase">{formatNight(event.startsAt)}</p>
        <ul className="mt-4 flex flex-col gap-2">
          {order.items.map((item) => (
            <li key={item.ticketTypeId} className="flex justify-between gap-4">
              <span>
                {item.quantity} × {names.get(item.ticketTypeId) ?? item.ticketTypeId}
              </span>
              <span className="tabular-nums">{formatPrice(Number(item.unitPrice) * item.quantity)}</span>
            </li>
          ))}
          {fees > 0 && (
            <li className="flex justify-between gap-4 text-tenue">
              <span>Cargo de servicio</span>
              <span className="tabular-nums">{formatPrice(fees)}</span>
            </li>
          )}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-linea pt-4">
          <span className="font-semibold">Total</span>
          <span className="display text-2xl tabular-nums">{formatPrice(Number(order.total))}</span>
        </div>
      </section>

      {expired ? (
        <Link
          href={backHref}
          className="mt-6 grid min-h-14 place-items-center rounded-full bg-luz text-lg font-semibold text-noche transition-transform duration-200 ease-out active:scale-[0.97]"
        >
          Elegir entradas
        </Link>
      ) : (
        <div className="mt-6">
          <ReservationTimer expiresAt={order.expiresAt} backHref={backHref} />
          {/* Acá va el botón a Checkout Pro: la preferencia se crea con el token del boliche y el marketplace_fee. */}
          <button
            type="button"
            disabled
            className="mt-4 flex min-h-14 w-full items-center justify-center rounded-full bg-luz text-lg font-semibold text-noche opacity-50"
          >
            Pagar con Mercado Pago
          </button>
          <p className="mt-2 text-center text-sm text-tenue">El pago online todavía no está habilitado.</p>
        </div>
      )}
    </>
  );
}
