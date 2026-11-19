"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { decodeCart } from "@/lib/cart";
import { formatNight, formatPrice, serviceFee } from "@/lib/format";
import { tickets, type Event, type Venue } from "@/lib/mock-data";

type FieldName = "name" | "phone" | "email";
type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;
type Line = { type: Event["ticketTypes"][number]; qty: number };

/** Orden en pantalla: el primer campo con error es el que recibe el foco. */
const FIELD_ORDER: FieldName[] = ["name", "phone", "email"];

/**
 * Número argentino de celular: 10 dígitos (característica + número).
 * Tolera +54, el 9 y el 0 de adelante, y espacios o guiones.
 */
function nationalPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9") && d.length === 11) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

function validate(field: FieldName, value: string): string | undefined {
  const v = value.trim();
  if (field === "name") {
    if (!v) return "Escribí tu nombre y apellido.";
    if (v.split(/\s+/).filter((w) => w.length > 1).length < 2)
      return "Falta el apellido. Poné nombre y apellido.";
  }
  if (field === "phone") {
    if (!v) return "Escribí tu número de WhatsApp.";
    if (nationalPhone(v).length !== 10)
      return "Revisá el número: son 10 dígitos con característica, sin 0 ni 15. Ej: 388 412 3456.";
  }
  if (field === "email") {
    if (!v) return "Escribí tu email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
      return "Revisá el email, parece incompleto. Ej: nombre@gmail.com.";
  }
}

export function CheckoutForm({ venue, event }: { venue: Venue; event: Event }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cart = decodeCart(searchParams.get("t"), event);
  const [paying, setPaying] = useState(false);
  const [values, setValues] = useState<Values>({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState<Errors>({});
  const formRef = useRef<HTMLFormElement>(null);

  const lines: Line[] = event.ticketTypes
    .filter((t) => cart[t.id])
    .map((t) => ({ type: t, qty: cart[t.id] }));
  const count = lines.reduce((s, l) => s + l.qty, 0);
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
      <div className="panel rounded-3xl p-6">
        <p className="text-lg font-semibold">Tu compra está vacía</p>
        <p className="mt-1 text-tenue">Elegí al menos una entrada para seguir.</p>
        <Link
          href={backHref}
          className="mt-4 grid min-h-12 place-items-center px-6 sm:inline-grid rounded-full bg-luz font-semibold text-noche transition-transform duration-200 ease-out active:scale-[0.97]"
        >
          Elegir entradas
        </Link>
      </div>
    );
  }

  function setValue(field: FieldName, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    // Si ya había un error, se corrige en vivo apenas la persona lo arregla.
    if (errors[field]) setErrors((e) => ({ ...e, [field]: validate(field, value) }));
  }

  function onBlur(field: FieldName) {
    // No marcar error en un campo que todavía no se tocó.
    if (!values[field] && !errors[field]) return;
    setErrors((e) => ({ ...e, [field]: validate(field, values[field]) }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (paying) return;
    const found: Errors = {};
    for (const f of FIELD_ORDER) found[f] = validate(f, values[f]);
    setErrors(found);
    const firstBad = FIELD_ORDER.find((f) => found[f]);
    if (firstBad) {
      const input = formRef.current?.elements.namedItem(firstBad);
      if (input instanceof HTMLElement) {
        input.focus({ preventScroll: true });
        input.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return;
    }
    setPaying(true);
    // DEMO: acá se crea la preferencia de Mercado Pago (Checkout Pro con
    // marketplace_fee) y se redirige a su init_point. Por ahora va directo
    // a una entrada de prueba.
    setTimeout(() => router.push(`/entrada/${tickets[0].code}`), 900);
  }

  const payLabel = `Pagar ${formatPrice(total)}`;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="grid gap-6 max-lg:pb-[calc(8rem+env(safe-area-inset-bottom))] lg:grid-cols-[1fr_22rem] lg:items-start lg:gap-10"
    >
      {/* Resumen: arriba y plegable en el celu; columna fija a la derecha en compu. */}
      <details className="panel group overflow-hidden rounded-3xl lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block truncate font-semibold">{event.title}</span>
            <span className="block text-sm text-tenue">
              {count} {count === 1 ? "entrada" : "entradas"} ·{" "}
              <span className="text-accent group-open:hidden">Ver detalle</span>
              <span className="hidden text-accent group-open:inline">Ocultar detalle</span>
            </span>
          </span>
          <span className="display shrink-0 text-xl tabular-nums">{formatPrice(total)}</span>
        </summary>
        <div className="border-t border-linea p-4">
          <OrderDetail event={event} lines={lines} fees={fees} total={total} backHref={backHref} />
        </div>
      </details>

      <fieldset disabled={paying} className="flex min-w-0 flex-col gap-5 lg:col-start-1 lg:row-start-1">
        <legend className="mb-3">
          <span className="block text-xl font-semibold">¿A quién le mandamos las entradas?</span>
          <span className="mt-1 block text-tenue">
            Te llegan por WhatsApp y por email. No hace falta crear una cuenta.
          </span>
        </legend>
        <Field
          label="Nombre y apellido"
          name="name"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          value={values.name}
          error={errors.name}
          onChange={(v) => setValue("name", v)}
          onBlur={() => onBlur("name")}
        />
        <Field
          label="WhatsApp"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          enterKeyHint="next"
          placeholder="388 412 3456"
          hint="Con característica, sin 0 ni 15."
          value={values.phone}
          error={errors.phone}
          onChange={(v) => setValue("phone", v)}
          onBlur={() => onBlur("phone")}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          placeholder="nombre@gmail.com"
          value={values.email}
          error={errors.email}
          onChange={(v) => setValue("email", v)}
          onBlur={() => onBlur("email")}
        />
      </fieldset>

      <aside className="panel hidden overflow-hidden rounded-3xl shadow-[0_40px_80px_-45px_var(--accent)] lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:block">
        <div className="p-5">
          <OrderDetail event={event} lines={lines} fees={fees} total={total} backHref={backHref} />
        </div>
        <div className="border-t border-linea p-5">
          <PayButton paying={paying} label={payLabel} />
          {/* Medios de pago sin confirmar con split: ver docs/research/mercado-pago-split.md */}
          <p className="mt-3 text-center text-sm text-tenue">
            El pago se hace en Mercado Pago.
          </p>
        </div>
      </aside>

      {/* Celu: botón fijo al borde de la pantalla, a mano del pulgar. */}
      <div data-visible className="ev-barra fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-noche/80 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden">
        <PayButton paying={paying} label={payLabel} />
        <p className="mt-2 text-center text-sm text-tenue">
          El pago se hace en Mercado Pago.
        </p>
      </div>
    </form>
  );
}

function OrderDetail({
  event,
  lines,
  fees,
  total,
  backHref,
}: {
  event: Event;
  lines: Line[];
  fees: number;
  total: number;
  backHref: string;
}) {
  return (
    <>
      <p className="font-semibold max-lg:hidden">{event.title}</p>
      <p className="text-sm text-tenue first-letter:uppercase">
        {formatNight(event.startsAt)}
      </p>
      <ul className="mt-4 flex flex-col gap-2">
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
        <span className="display text-2xl tabular-nums">{formatPrice(total)}</span>
      </div>
      <Link href={backHref} className="mt-1 inline-block py-3 text-tenue underline underline-offset-4">
        Cambiar entradas
      </Link>
    </>
  );
}

function PayButton({ paying, label }: { paying: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={paying}
      aria-busy={paying}
      className="flex min-h-14 w-full items-center justify-center gap-3 text-lg disabled:cursor-wait disabled:opacity-80 rounded-full bg-luz font-semibold text-noche transition-transform duration-200 ease-out active:scale-[0.97]"
    >
      {paying && (
        <span
          className="size-5 animate-spin rounded-full border-2 border-noche/30 border-t-noche motion-reduce:animate-none"
          aria-hidden
        />
      )}
      {paying ? "Abriendo Mercado Pago…" : label}
    </button>
  );
}

function Field({
  label,
  hint,
  error,
  onChange,
  name,
  ...props
}: {
  label: string;
  hint?: string;
  error?: string;
  name: FieldName;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "name">) {
  const id = `campo-${name}`;
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        {...props}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`h-14 rounded-2xl border bg-noche-2/70 px-4 text-base outline-none backdrop-blur transition-[border-color,box-shadow] duration-200 placeholder:text-tenue/50 focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent)_22%,transparent)] ${
          error ? "border-error" : "border-linea"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-error">
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-tenue">
          {hint}
        </p>
      )}
    </div>
  );
}
