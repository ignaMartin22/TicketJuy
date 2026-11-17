"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { decodeCart } from "@/lib/cart";
import { formatNight, formatPrice, serviceFee } from "@/lib/format";
import { tickets, type Event, type Venue } from "@/lib/mock-data";

export function CheckoutForm({ venue, event }: { venue: Venue; event: Event }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cart = decodeCart(searchParams.get("t"), event);
  const [paying, setPaying] = useState(false);

  const lines = event.ticketTypes
    .filter((t) => cart[t.id])
    .map((t) => ({ type: t, qty: cart[t.id] }));
  const subtotal = lines.reduce((s, l) => s + l.type.price * l.qty, 0);
  const fees =
    venue.feeMode === "buyer"
      ? lines.reduce(
          (s, l) => s + serviceFee(l.type.price, venue.buyerFeeRate) * l.qty,
          0,
        )
      : 0;
  const total = subtotal + fees;
  const backHref = `/${venue.slug}/${event.slug}`;

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-linea p-6">
        <p className="font-semibold">Tu compra está vacía</p>
        <p className="mt-1 text-tenue">Elegí al menos una entrada para seguir.</p>
        <Link
          href={backHref}
          className="mt-4 inline-block rounded-full bg-accent px-5 py-3 font-semibold text-accent-foreground"
        >
          Elegir entradas
        </Link>
      </div>
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPaying(true);
    // DEMO: acá se crea la preferencia de Mercado Pago (Checkout Pro con
    // marketplace_fee) y se redirige a su init_point. Por ahora va directo
    // a una entrada de prueba.
    setTimeout(() => router.push(`/entrada/${tickets[0].code}`), 900);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start"
    >
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-semibold">¿A quién le mandamos las entradas?</h2>
          <p className="text-tenue">
            Te llegan por WhatsApp y por email. No hace falta crear una cuenta.
          </p>
        </div>
        <Field label="Nombre y apellido" name="name" autoComplete="name" />
        <Field
          label="WhatsApp"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="388 412 3456"
          hint="Con característica, sin 0 ni 15."
        />
        <Field label="Email" name="email" type="email" autoComplete="email" />
      </section>

      <aside className="overflow-hidden rounded-2xl border border-linea bg-noche-2 lg:sticky lg:top-20">
        <div className="p-5">
          <p className="font-semibold">{event.title}</p>
          <p className="text-sm text-tenue first-letter:uppercase">
            {formatNight(event.startsAt)}
          </p>
          <ul className="mt-5 flex flex-col gap-2">
            {lines.map(({ type, qty }) => (
              <li key={type.id} className="flex justify-between gap-4">
                <span>
                  {qty} × {type.name}
                </span>
                <span className="tabular-nums">{formatPrice(type.price * qty)}</span>
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
            <span className="display text-4xl tabular-nums">{formatPrice(total)}</span>
          </div>
          <Link href={backHref} className="mt-2 inline-block text-sm text-tenue underline underline-offset-4">
            Cambiar entradas
          </Link>
        </div>

        <div className="border-t border-linea p-5 max-lg:sticky max-lg:bottom-0">
          <button
            type="submit"
            disabled={paying}
            className="neon-soft w-full rounded-full bg-accent py-4 text-lg font-semibold text-accent-foreground disabled:opacity-60"
          >
            {paying ? "Abriendo Mercado Pago…" : `Pagar ${formatPrice(total)}`}
          </button>
          {/* Medios de pago sin confirmar con split: ver docs/research/mercado-pago-split.md */}
          <p className="mt-3 text-center text-sm text-tenue">
            El pago se hace en Mercado Pago.
          </p>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  hint,
  ...props
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-medium">{label}</span>
      <input
        required
        {...props}
        className="h-13 rounded-xl border border-linea bg-noche-2 px-4 text-base outline-none placeholder:text-tenue/50 focus:border-accent"
      />
      {hint && <span className="text-sm text-tenue">{hint}</span>}
    </label>
  );
}
