import type { Metadata } from "next";
import { Suspense, type CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventCatalog, hasLiveCatalog } from "@/lib/catalog";
import { TicketStub } from "@/components/ticket-stub";
import { formatNight, formatPrice } from "@/lib/format";
import { getOrder, syncOrder, type Order } from "@/lib/orders";
import { qrSvg } from "@/lib/qr";
import { PayButton } from "./pay-button";
import { PaymentWatcher } from "./payment-watcher";
import { ReservationTimer } from "./reservation-timer";

export const metadata: Metadata = {
  title: "Tu reserva",
  robots: { index: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Lee el pedido. Si todavía no figura pagado, primero le pide al backend que consulte
 * Mercado Pago (sync): así el comprador que vuelve del pago ve sus entradas aunque
 * el aviso de Mercado Pago no haya llegado. Si el sync falla, se muestra lo que hay.
 */
async function loadOrder(venueSlug: string, eventSlug: string, orderId: string): Promise<Order | null> {
  const order = await getOrder(venueSlug, eventSlug, orderId);
  if (!order || order.status === "paid") return order;
  try {
    return (await syncOrder(venueSlug, eventSlug, orderId)) ?? order;
  } catch {
    return order;
  }
}

/** Pedido reservado en ticketera-core: espera el pago o muestra las entradas. */
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
    loadOrder(venueSlug, eventSlug, orderId),
  ]);
  if (!catalog || !order) notFound();
  const { event, venue } = catalog;
  const names = new Map(event.ticketTypes.map((t) => [t.id, t.name]));
  const fees = order.items.reduce((s, i) => s + Number(i.unitServiceFee) * i.quantity, 0);
  const backHref = `/${venueSlug}/${eventSlug}`;
  const paid = order.status === "paid";
  const expired = order.status === "expired";
  // Pago aprobado que no se pudo convertir en entradas: lo resuelve el boliche a mano.
  const review = order.paymentReview && !paid;
  const qrs = paid ? await Promise.all(order.tickets.map((t) => qrSvg(t.qr))) : [];
  const count = order.tickets.length;

  return (
    <div style={paid ? ({ "--accent": venue.accent } as CSSProperties) : undefined}>
      <h1 className="display text-4xl sm:text-5xl">
        {paid ? "Tus entradas" : review ? "Recibimos tu pago" : expired ? "La reserva venció" : "Reservamos tus entradas"}
      </h1>
      <p className="mt-2 text-tenue">
        {paid
          ? count === 1
            ? "Tenés 1 entrada. El QR sirve para un solo ingreso."
            : `Tenés ${count} entradas. Deslizá para verlas: cada QR sirve para un solo ingreso.`
          : review
            ? "Pero no pudimos emitir tus entradas. Escribile al boliche con este número de pedido."
            : expired
            ? "Pasaron los 10 minutos y el cupo se liberó. Podés volver a elegir tus entradas."
            : "Las guardamos a tu nombre mientras completás el pago."}
      </p>

      {order.paymentReview && (
        <section role="alert" className="mt-6 rounded-3xl border border-amber-300/40 bg-amber-300/10 p-5">
          <p className="font-semibold text-amber-200">
            {paid ? "Recibimos un pago de más en este pedido." : "Tu pago quedó en revisión."}
          </p>
          <p className="mt-1 text-sm text-luz/80">
            {paid
              ? "Tus entradas son válidas. Escribile al boliche con este número de pedido para que te devuelvan lo que sobra."
              : "No se hace un reembolso automático. Escribile al boliche y pasale este número de pedido:"}
          </p>
          <p className="mt-3 select-all break-all rounded-xl bg-noche/60 px-3 py-2 font-mono text-sm">{order.id}</p>
          {venue.instagram && (
            <a
              href={`https://instagram.com/${venue.instagram.replace(/^@/, "")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-semibold underline underline-offset-4"
            >
              Escribirle a {venue.name} por Instagram
            </a>
          )}
        </section>
      )}

      {paid && (
        // Con más de una entrada, carrusel: en la puerta se muestra un QR por vez
        // y no se escanea el de al lado por error.
        <ol
          className={
            count > 1
              ? "carrusel -mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6"
              : "mt-6 flex flex-col items-center"
          }
        >
          {order.tickets.map((ticket, i) => (
            <li
              key={ticket.id}
              className={`flex flex-col items-center gap-3 ${count > 1 ? "w-[86%] max-w-sm shrink-0 snap-center" : "w-full"}`}
            >
              {count > 1 && (
                <p className="font-semibold text-tenue tabular-nums">
                  {`Entrada ${i + 1} de ${count}`}
                  {ticket.usedAt ? " · usada" : ""}
                </p>
              )}
              <TicketStub
                venue={venue}
                event={event}
                type={{
                  id: ticket.ticketTypeId,
                  name: ticket.ticketTypeName,
                  description: "",
                  price: 0,
                  capacity: 0,
                  sold: 0,
                }}
                ticket={{
                  code: ticket.id.slice(0, 8).toUpperCase(),
                  status: ticket.usedAt ? "used" : "valid",
                }}
                qr={qrs[i]}
                validUntil={ticket.validUntil}
                big
              />
            </li>
          ))}
        </ol>
      )}

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

      {!paid && !order.paymentReview && (
        <PaymentWatcher
          venueSlug={venueSlug}
          eventSlug={eventSlug}
          orderId={order.id}
          status={order.status}
          expiresAt={order.expiresAt}
        />
      )}

      {paid || review ? (
        <Link href={backHref} className="mt-6 block py-3 text-center text-tenue underline underline-offset-4">
          Ver la fecha
        </Link>
      ) : expired ? (
        <Link
          href={backHref}
          className="mt-6 grid min-h-14 place-items-center rounded-full bg-luz text-lg font-semibold text-noche transition-transform duration-200 ease-out active:scale-[0.97]"
        >
          Elegir entradas
        </Link>
      ) : (
        <div className="mt-6">
          <ReservationTimer expiresAt={order.expiresAt} backHref={backHref} />
          <PayButton venueSlug={venueSlug} eventSlug={eventSlug} orderId={order.id} methods={order.paymentMethods ?? []} />
        </div>
      )}
    </div>
  );
}
