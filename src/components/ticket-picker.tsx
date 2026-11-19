"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { encodeCart, MAX_PER_ORDER, type Cart } from "@/lib/cart";
import { formatPrice, serviceFee } from "@/lib/format";
import type { Event, Venue } from "@/lib/mock-data";

export function TicketPicker({ venue, event }: { venue: Venue; event: Event }) {
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
  const barVisible = from !== null && (hasCart || !listVisible);

  return (
    <>
      {from === null && (
        <p className="mt-3 rounded-2xl border border-dashed border-linea p-4 text-tenue">
          Las entradas de esta fecha están agotadas.
        </p>
      )}
      <ul
        ref={listRef}
        className="entra-lista mt-3 flex flex-col gap-2.5"
        style={{ "--d": "550ms" } as React.CSSProperties}
      >
        {event.ticketTypes.map((t) => {
          const left = t.capacity - t.sold;
          const soldOut = left <= 0;
          const qty = cart[t.id] ?? 0;
          const fee = serviceFee(t.price, venue.buyerFeeRate);

          // Agotada: una línea, sin ocupar lo mismo que las que se pueden comprar.
          if (soldOut) {
            return (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-white/12 px-4 py-2.5 text-sm text-white/50"
              >
                <span className="flex items-center gap-2 font-medium">
                  {t.name}
                  <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs">Agotada</span>
                </span>
                <span className="tabular-nums line-through">{formatPrice(finalPrice(t.price))}</span>
              </li>
            );
          }

          return (
            <li key={t.id} className="ev-ticket" data-elegida={qty > 0 || undefined}>
              <div className="ev-ticket-cuerpo">
                <div className="min-w-0 px-4 py-3">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold leading-tight">
                    {t.name}
                    {left <= 30 && (
                      <span className="whitespace-nowrap rounded-full bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] px-2 py-0.5 text-xs font-medium text-accent">
                        Quedan {left}
                      </span>
                    )}
                  </p>
                  {/* "Ingreso general." es lo de siempre: sólo se muestra lo que agrega algo (VIP, etc.). */}
                  {t.description !== "Ingreso general." && (
                    <p className="mt-0.5 text-xs text-tenue">{t.description}</p>
                  )}
                  <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
                    <span className="inf-titulo text-xl tabular-nums">{formatPrice(finalPrice(t.price))}</span>
                    {buyerPays && <span className="text-xs text-tenue">incluye {formatPrice(fee)} de servicio</span>}
                  </p>
                </div>

                {/* El talón, separado por la línea punteada: ahí se elige cuántas. */}
                <div className="ev-talon grid place-items-center">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => change(t.id, -1)}
                      disabled={qty === 0}
                      aria-label={`Quitar una entrada ${t.name}`}
                      className="grid size-11 place-items-center rounded-full text-2xl leading-none max-[380px]:size-10 transition-transform duration-150 ease-out active:scale-90 disabled:opacity-25"
                    >
                      −
                    </button>
                    <span
                      key={qty}
                      className={`ev-titila w-7 max-[380px]:w-6 text-center text-xl font-semibold tabular-nums ${qty > 0 ? "text-accent" : ""}`}
                      aria-live="polite"
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => change(t.id, 1)}
                      disabled={count >= MAX_PER_ORDER || qty >= left}
                      aria-label={`Agregar una entrada ${t.name}`}
                      className="grid size-11 place-items-center rounded-full bg-luz max-[380px]:size-10 text-2xl leading-none text-noche transition-transform duration-150 ease-out active:scale-90 disabled:opacity-25"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {count >= MAX_PER_ORDER && (
        <p className="mt-3 text-sm text-tenue">
          Máximo {MAX_PER_ORDER} entradas por compra.
        </p>
      )}

      {/* En la compu el resumen va dentro del panel fijo; la barra de abajo es para el celu. */}
      {from !== null && (
        <div className="mt-3 hidden items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 lg:flex">
          {hasCart ? (
            <div>
              <p className="text-sm text-tenue">
                {count} {count === 1 ? "entrada" : "entradas"}
              </p>
              <p key={total} className="ev-titila inf-titulo text-2xl tabular-nums">
                {formatPrice(total)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-tenue">Sumá entradas con el +</p>
          )}
          {hasCart ? (
            <Link
              href={`/${venue.slug}/${event.slug}/checkout?t=${encodeCart(cart)}`}
              className="grid min-h-12 place-items-center rounded-full bg-luz px-7 font-semibold text-noche transition-transform duration-200 ease-out active:scale-[0.97]"
            >
              Continuar
            </Link>
          ) : (
            <span className="grid min-h-12 place-items-center rounded-full border border-white/15 px-6 text-sm text-white/50">
              Continuar
            </span>
          )}
        </div>
      )}

      {/* Barra fija: siempre a mano del pulgar. Vacía lleva a las entradas; con carrito, sigue al pago. */}
      <div
        className={`ev-barra fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-linea bg-noche/80 backdrop-blur-xl transition-transform duration-300 motion-reduce:transition-none ${
          barVisible ? "translate-y-0" : "translate-y-full"
        }`}
        inert={!barVisible}
        // Mientras se ve, la página reserva su lugar abajo (ver .ev-barra en infinity.css).
        data-visible={barVisible || undefined}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          {hasCart ? (
            <>
              <div>
                <p className="text-sm text-tenue">
                  {count} {count === 1 ? "entrada" : "entradas"}
                </p>
                <p key={total} className="ev-titila display text-2xl tabular-nums">
                  {formatPrice(total)}
                </p>
              </div>
              <Link
                href={`/${venue.slug}/${event.slug}/checkout?t=${encodeCart(cart)}`}
                className="grid min-h-12 place-items-center px-8 text-lg rounded-full bg-luz font-semibold text-noche transition-transform duration-200 ease-out active:scale-[0.97]"
              >
                Continuar
              </Link>
            </>
          ) : (
            <a
              href="#entradas"
              className="flex min-h-14 w-full flex-col items-center justify-center px-6 leading-tight rounded-full bg-luz font-semibold text-noche transition-transform duration-200 ease-out active:scale-[0.97]"
            >
              {/* En dos líneas: en una no entra a 360px. */}
              <span className="text-lg font-semibold">Comprar entradas</span>
              {from !== null && (
                <span className="text-sm font-medium opacity-70">
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
