"use client";

import Link from "next/link";
import { useState } from "react";
import { encodeCart, MAX_PER_ORDER, type Cart } from "@/lib/cart";
import { formatPrice, serviceFee } from "@/lib/format";
import type { Event, Venue } from "@/lib/mock-data";

export function TicketPicker({ venue, event }: { venue: Venue; event: Event }) {
  const [cart, setCart] = useState<Cart>({});

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = event.ticketTypes.reduce(
    (sum, t) => sum + t.price * (cart[t.id] ?? 0),
    0,
  );

  function change(id: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) };
      if (next[id] === 0) delete next[id];
      return next;
    });
  }

  return (
    <>
      <ul className="entra-lista mt-3 flex flex-col" style={{ "--d": "550ms" } as React.CSSProperties}>
        {event.ticketTypes.map((t) => {
          const left = t.capacity - t.sold;
          const soldOut = left <= 0;
          const qty = cart[t.id] ?? 0;
          return (
            <li
              key={t.id}
              className="flex items-center justify-between gap-4 border-t border-dashed border-linea py-5 last:border-b"
            >
              <div className={`min-w-0 ${soldOut ? "text-tenue" : ""}`}>
                <p className="font-semibold">
                  {t.name}
                  {soldOut && (
                    <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-noche-3 px-2 py-0.5 align-middle text-xs font-medium">
                      Agotada
                    </span>
                  )}
                  {!soldOut && left <= 30 && (
                    <span className="ml-2 inline-block whitespace-nowrap rounded-full bg-accent/15 px-2 py-0.5 align-middle text-xs font-medium text-accent">
                      Quedan {left}
                    </span>
                  )}
                </p>
                <p className="text-sm text-tenue">{t.description}</p>
                <p className={`mt-1 text-lg font-semibold ${soldOut ? "line-through" : ""}`}>
                  {formatPrice(t.price)}
                  {venue.feeMode === "buyer" && !soldOut && (
                    <span className="ml-1.5 text-sm font-normal text-tenue">
                      + {formatPrice(serviceFee(t.price, venue.buyerFeeRate))} de
                      servicio
                    </span>
                  )}
                </p>
              </div>

              {!soldOut && (
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-noche-2 p-1">
                  <button
                    type="button"
                    onClick={() => change(t.id, -1)}
                    disabled={qty === 0}
                    aria-label={`Quitar una entrada ${t.name}`}
                    className="grid size-10 place-items-center rounded-full text-2xl leading-none hover:bg-noche-3 disabled:opacity-25"
                  >
                    −
                  </button>
                  <span
                    className="w-6 text-center text-lg font-semibold tabular-nums"
                    aria-live="polite"
                  >
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => change(t.id, 1)}
                    disabled={count >= MAX_PER_ORDER || qty >= left}
                    aria-label={`Agregar una entrada ${t.name}`}
                    className="grid size-10 place-items-center rounded-full bg-accent text-2xl leading-none text-accent-foreground disabled:opacity-25"
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

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-noche/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none ${
          count > 0 ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={count === 0}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <div>
            <p className="text-sm text-tenue">
              {count} {count === 1 ? "entrada" : "entradas"}
            </p>
            <p className="text-xl font-semibold tabular-nums">{formatPrice(subtotal)}</p>
          </div>
          <Link
            href={`/${venue.slug}/${event.slug}/checkout?t=${encodeCart(cart)}`}
            tabIndex={count === 0 ? -1 : undefined}
            className="neon-soft rounded-full bg-accent px-7 py-3.5 font-semibold text-accent-foreground"
          >
            Continuar
          </Link>
        </div>
      </div>
    </>
  );
}
