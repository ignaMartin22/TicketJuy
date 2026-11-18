"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { encodeCart, MAX_PER_ORDER, type Cart } from "@/lib/cart";
import { formatPrice, serviceFee } from "@/lib/format";
import type { Event, Venue } from "@/lib/mock-data";

export function TicketPicker({ venue, event, readOnly = false }: {
  venue: Venue;
  event: Event;
  readOnly?: boolean;
}) {
  const [cart, setCart] = useState<Cart>({});
  // La lista de entradas ¿se ve en pantalla? Si sí, no hace falta el atajo.
  const [listVisible, setListVisible] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);

  const buyerPays = venue.feeMode === "buyer";
  /** Lo que realmente paga la persona por una entrada. */
  const finalPrice = (price: number) =>
    price + (buyerPays ? serviceFee(price, venue.buyerFeeRate) : 0);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = event.ticketTypes.reduce(
    (sum, t) => sum + finalPrice(t.price) * (cart[t.id] ?? 0),
    0,
  );
  const available = event.ticketTypes.filter((t) => t.capacity - t.sold > 0);
  const from = available.length
    ? Math.min(...available.map((t) => finalPrice(t.price)))
    : null;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // El margen inferior descuenta la barra fija: lo tapado no cuenta como visto.
    // Que asome el borde de la lista no alcanza: tiene que verse al menos una
    // tarjeta entera (≈ 160px) para esconder el atajo.
    const io = new IntersectionObserver(
      ([entry]) =>
        setListVisible(entry.isIntersecting && entry.intersectionRect.height >= 160),
      {
        rootMargin: "0px 0px -96px 0px",
        threshold: Array.from({ length: 21 }, (_, i) => i / 20),
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function change(id: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  const hasCart = count > 0;
  // Con el carrito vacío, la barra es solo un atajo: se esconde si ya ves las entradas.
  const barVisible = !readOnly && from !== null && (hasCart || !listVisible);

  return (
    <>
      {readOnly && <p className="mt-3 text-tenue">La compra online todavía no está disponible.</p>}
      {from === null && event.ticketTypes.length > 0 && (
        <p className="mt-3 rounded-2xl border border-dashed border-linea p-4 text-tenue">
          Las entradas de esta fecha están agotadas.
        </p>
      )}
      <ul
        ref={listRef}
        className="entra-lista mt-3 flex flex-col gap-3"
        style={{ "--d": "550ms" } as React.CSSProperties}
      >
        {event.ticketTypes.map((t) => {
          const left = t.capacity - t.sold;
          const soldOut = left <= 0;
          const qty = cart[t.id] ?? 0;
          const fee = serviceFee(t.price, venue.buyerFeeRate);
          return (
            <li
              key={t.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors ${
                qty > 0
                  ? "neon-soft border-accent bg-accent/10"
                  : "border-linea bg-noche-2/60"
              } ${soldOut ? "opacity-70" : ""}`}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-semibold leading-tight">
                  {t.name}
                  {soldOut && (
                    <span className="whitespace-nowrap rounded-full bg-noche-3 px-2.5 py-0.5 text-sm font-medium text-tenue">
                      Agotada
                    </span>
                  )}
                  {!soldOut && left <= 30 && (
                    <span className="whitespace-nowrap rounded-full bg-accent/15 px-2.5 py-0.5 text-sm font-medium text-accent">
                      Quedan {left}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-sm text-tenue">{t.description}</p>
                <p
                  className={`mt-2 text-2xl font-semibold tabular-nums ${
                    soldOut ? "text-tenue line-through" : ""
                  }`}
                >
                  {formatPrice(finalPrice(t.price))}
                </p>
                {buyerPays && !soldOut && (
                  <p className="text-sm text-tenue">
                    Incluye {formatPrice(fee)} de servicio
                  </p>
                )}
              </div>

              {!readOnly && !soldOut && (
                <div className="flex shrink-0 items-center rounded-full bg-noche p-1">
                  <button
                    type="button"
                    onClick={() => change(t.id, -1)}
                    disabled={qty === 0}
                    aria-label={`Quitar una entrada ${t.name}`}
                    className="grid size-12 place-items-center rounded-full text-3xl leading-none active:bg-noche-3 disabled:opacity-25"
                  >
                    −
                  </button>
                  <span
                    className={`w-8 text-center text-xl font-semibold tabular-nums ${
                      qty > 0 ? "text-accent" : ""
                    }`}
                    aria-live="polite"
                  >
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => change(t.id, 1)}
                    disabled={count >= MAX_PER_ORDER || qty >= left}
                    aria-label={`Agregar una entrada ${t.name}`}
                    className="grid size-12 place-items-center rounded-full bg-accent text-3xl leading-none text-accent-foreground disabled:opacity-25"
                  >
                    +
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {count >= MAX_PER_ORDER && (
        <p className="mt-3 text-sm text-tenue">
          Máximo {MAX_PER_ORDER} entradas por compra.
        </p>
      )}

      {/* Barra fija: siempre a mano del pulgar. Vacía lleva a las entradas; con carrito, sigue al pago. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-noche/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none ${
          barVisible ? "translate-y-0" : "translate-y-full"
        }`}
        inert={!barVisible}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          {hasCart ? (
            <>
              <div>
                <p className="text-sm text-tenue">
                  {count} {count === 1 ? "entrada" : "entradas"}
                </p>
                <p className="text-2xl font-semibold tabular-nums leading-tight">
                  {formatPrice(total)}
                </p>
              </div>
              <Link
                href={`/${venue.slug}/${event.slug}/checkout?t=${encodeCart(cart)}`}
                className="neon-soft grid min-h-12 place-items-center rounded-full bg-accent px-8 text-lg font-semibold text-accent-foreground"
              >
                Continuar
              </Link>
            </>
          ) : (
            <a
              href="#entradas"
              className="neon-soft flex min-h-14 w-full flex-col items-center justify-center rounded-full bg-accent px-6 leading-tight text-accent-foreground"
            >
              {/* En dos líneas: en una no entra a 360px. */}
              <span className="text-lg font-semibold">Comprar entradas</span>
              {from !== null && (
                <span className="text-sm font-medium opacity-80">
                  desde {formatPrice(from)}
                </span>
              )}
            </a>
          )}
        </div>
      </div>
    </>
  );
}
