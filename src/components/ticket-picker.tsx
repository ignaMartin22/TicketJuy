"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { encodeCart, MAX_PER_ORDER, type Cart } from "@/lib/cart";
import { formatPrice, serviceFee } from "@/lib/format";
import { availableTickets, type Event, type Venue } from "@/lib/mock-data";
import { sendDust } from "@/lib/dust";
import { RollingPrice } from "./rolling-price";

export function TicketPicker({ venue, event }: { venue: Venue; event: Event }) {
  const [cart, setCart] = useState<Cart>({});
  // Lo que muestra el total: al sumar, cambia cuando le llega el polvo de la entrada.
  const [landed, setLanded] = useState<Cart>({});
  const cartRef = useRef(cart);
  /** Cuántas veces se sumó cada tipo: reinicia el brillo de la fila. */
  const [sparks, setSparks] = useState<Record<string, number>>({});
  // La lista de entradas ¿se ve en pantalla? Si sí, no hace falta el atajo.
  const [listVisible, setListVisible] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);

  const buyerPays = venue.feeMode === "buyer";
  /** Lo que realmente paga la persona por una entrada. */
  const finalPrice = (price: number) =>
    price + (buyerPays ? serviceFee(price, venue.buyerFeeRate) : 0);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalOf = (c: Cart) =>
    event.ticketTypes.reduce((sum, t) => sum + finalPrice(t.price) * (c[t.id] ?? 0), 0);
  const shownTotal = totalOf(landed);
  const available = event.ticketTypes.filter((t) => availableTickets(t) > 0);
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
    const prev = cartRef.current;
    const next = { ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) };
    if (next[id] === 0) delete next[id];
    cartRef.current = next;
    setCart(next);
    // Al quitar, el total cambia ya; al sumar, cuando llega el polvo.
    if (delta < 0) setLanded(next);
  }

  function add(id: string, button: HTMLButtonElement) {
    change(id, 1);
    setSparks((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
    const row = button.closest("li");
    const b = button.getBoundingClientRect();
    const css = getComputedStyle(row ?? button);
    const tono = css.getPropertyValue("--tono").trim();
    const cian = css.getPropertyValue("--inf-cian").trim() || "#17b8f1";
    const magenta = css.getPropertyValue("--inf-magenta").trim() || "#ee10b8";
    sendDust({
      from: (row ?? button).getBoundingClientRect(),
      origin: { x: b.left + b.width / 2, y: b.top + b.height / 2 },
      // El total que se ve: la barra de abajo en el celu, el resumen en la compu.
      target: () => {
        for (const el of document.querySelectorAll("[data-destino-polvo]")) {
          const r = el.getBoundingClientRect();
          if (r.width > 0) return r;
        }
        return null;
      },
      colors: [cian, magenta, tono || magenta, "#ffffff", "#c9b8ff"],
      onArrive: () => setLanded(cartRef.current),
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
        className="entra-lista mt-3 flex flex-col gap-2"
        style={{ "--d": "550ms" } as React.CSSProperties}
      >
        {event.ticketTypes.map((t) => {
          const left = availableTickets(t);
          const soldOut = left <= 0;
          const qty = cart[t.id] ?? 0;

          // Agotada: una línea tenue, sin controles.
          if (soldOut) {
            return (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-white/40">
                <span>
                  {t.name} <span className="text-white/30">· agotada</span>
                </span>
                <span className="tabular-nums line-through">{formatPrice(finalPrice(t.price))}</span>
              </li>
            );
          }

          return (
            <li key={t.id} className="ev-fila flex items-center gap-3 py-3 pl-4 pr-2.5" data-elegida={qty > 0 || undefined}>
              {/* Brillo que barre la fila cuando suelta el polvo; la key lo reinicia en cada +. */}
              {sparks[t.id] ? <span key={sparks[t.id]} className="ev-fila-brillo" aria-hidden /> : null}
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">
                  {t.name}
                  {left <= 30 && (
                    <span className="ml-2 text-sm font-medium text-[var(--tono,var(--accent))]">
                      {left <= 10 ? `¡últimas ${left}!` : `quedan ${left}`}
                    </span>
                  )}
                </p>
                {/* "Ingreso general." es lo de siempre: sólo se muestra lo que agrega algo (VIP, etc.). */}
                {t.description !== "Ingreso general." && (
                  <p className="mt-0.5 text-xs text-tenue">{t.description}</p>
                )}
                {/* En el celu el precio va debajo del nombre, así el nombre no se parte. */}
                <p className="inf-titulo mt-1 text-lg tabular-nums sm:hidden">{formatPrice(finalPrice(t.price))}</p>
              </div>
              <span className="inf-titulo shrink-0 text-lg tabular-nums max-sm:hidden">{formatPrice(finalPrice(t.price))}</span>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => change(t.id, -1)}
                  disabled={qty === 0}
                  aria-label={`Quitar una entrada ${t.name}`}
                  className="grid size-10 place-items-center rounded-full text-2xl leading-none transition-transform duration-150 ease-out active:scale-90 disabled:opacity-20"
                >
                  −
                </button>
                <span
                  key={qty}
                  className={`ev-titila w-6 text-center text-lg font-semibold tabular-nums ${qty > 0 ? "text-luz" : "text-white/40"}`}
                  aria-live="polite"
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={(e) => add(t.id, e.currentTarget)}
                  disabled={count >= MAX_PER_ORDER || qty >= left}
                  aria-label={`Agregar una entrada ${t.name}`}
                  className="grid size-10 place-items-center rounded-full bg-luz text-2xl leading-none text-noche transition-transform duration-150 ease-out active:scale-90 disabled:opacity-25"
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {buyerPays && from !== null && (
        <p className="mt-2 px-1 text-xs text-tenue">Los precios incluyen el cargo de servicio.</p>
      )}
      {count >= MAX_PER_ORDER && (
        <p className="mt-3 text-sm text-tenue">
          Máximo {MAX_PER_ORDER} entradas por compra.
        </p>
      )}

      {/* En la compu el resumen va dentro del panel fijo; la barra de abajo es para el celu. */}
      {from !== null && (
        <div className="mt-3 hidden items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 lg:flex">
          {hasCart ? (
            <div>
              <p className="text-sm text-tenue">
                {count} {count === 1 ? "entrada" : "entradas"}
              </p>
              <p className="inf-titulo text-2xl tabular-nums" data-destino-polvo>
                <RollingPrice value={shownTotal} />
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
                <p className="display text-2xl tabular-nums" data-destino-polvo>
                  <RollingPrice value={shownTotal} />
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
