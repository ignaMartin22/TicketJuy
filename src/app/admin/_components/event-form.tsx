"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { formatNight, formatPrice } from "@/lib/format";
import { fromNightInputs } from "../_lib/dates";
import {
  draftToInput,
  newTicket,
  validate,
  type Draft,
  type DraftTicket,
  type Errors,
} from "../_lib/draft";
import { createEvent, StorageFullError, updateEvent } from "../_lib/store";
import type { TicketKind } from "../_lib/types";
import { CoverInput } from "./cover-input";
import { PlusIcon, TrashIcon } from "./icons";
import { buttonClass, Card } from "./ui";

/**
 * Alta y edición de un evento. Con `slug` edita ese evento; sin él, crea uno.
 */
export function EventForm({ initial, slug }: { initial: Draft; slug?: string }) {
  const router = useRouter();
  const isNew = !slug;
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // Avisar antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  /** Al tocar un campo con error, el error se va hasta el próximo intento de guardar. */
  function clearErrors(keys: string[]) {
    setErrors((prev) => {
      if (!keys.some((k) => k in prev)) return prev;
      const next = { ...prev };
      for (const k of keys) delete next[k];
      return next;
    });
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
    clearErrors(key === "time" ? ["time", "date"] : [key]);
  }

  function setTicket(id: string, patch: Partial<DraftTicket>) {
    setDraft((d) => ({
      ...d,
      tickets: d.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
    setDirty(true);
    clearErrors(Object.keys(patch).map((field) => `ticket.${id}.${field}`));
  }

  function addTicket(kind: TicketKind) {
    setDraft((d) => ({ ...d, tickets: [...d.tickets, newTicket(kind, d.tickets.map((t) => t.id))] }));
    setDirty(true);
    clearErrors(["tickets"]);
  }

  function removeTicket(id: string) {
    setDraft((d) => ({ ...d, tickets: d.tickets.filter((t) => t.id !== id) }));
    setDirty(true);
    clearErrors(["name", "price", "capacity"].map((field) => `ticket.${id}.${field}`));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const found = validate(draft, { isNew });
    setErrors(found);
    setSaveError(null);
    if (Object.keys(found).length > 0) {
      // El resumen de errores toma el foco para que se lea y se vea.
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    try {
      const input = draftToInput(draft);
      let saved = slug;
      if (saved) updateEvent(saved, input);
      else saved = createEvent(input);
      setDirty(false);
      router.push(`/admin/eventos/${saved}`);
    } catch (err) {
      setSaveError(
        err instanceof StorageFullError ? err.message : "No se pudo guardar. Probá de nuevo.",
      );
    }
  }

  const errorCount = Object.keys(errors).length;
  const preview =
    draft.date && draft.time ? formatNight(fromNightInputs(draft.date, draft.time)) : null;

  return (
    <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-6">
      {(errorCount > 0 || saveError) && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error"
        >
          {saveError ??
            (errorCount === 1
              ? "Hay 1 dato para revisar."
              : `Hay ${errorCount} datos para revisar.`)}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <Section title="Información">
            <Field label="Nombre del evento" error={errors.title}>
              {(p) => (
                <input
                  {...p}
                  value={draft.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Noche de Luna Llena"
                  className={inputClass}
                  autoComplete="off"
                />
              )}
            </Field>
            <Field label="Artistas" hint="Separados por coma." optional>
              {(p) => (
                <input
                  {...p}
                  value={draft.lineup}
                  onChange={(e) => set("lineup", e.target.value)}
                  placeholder="Vale Quispe, Residentes Moon"
                  className={inputClass}
                  autoComplete="off"
                />
              )}
            </Field>
            <Field label="Descripción" optional>
              {(p) => (
                <textarea
                  {...p}
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                  placeholder="Qué música hay, si hay show en vivo, promos…"
                  className={`${inputClass} resize-y py-2.5`}
                />
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Edad mínima" error={errors.ageLimit}>
                {(p) => (
                  <input
                    {...p}
                    inputMode="numeric"
                    value={draft.ageLimit}
                    onChange={(e) => set("ageLimit", e.target.value)}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Dress code" optional>
                {(p) => (
                  <input
                    {...p}
                    value={draft.dressCode}
                    onChange={(e) => set("dressCode", e.target.value)}
                    placeholder="Elegante sport"
                    className={inputClass}
                  />
                )}
              </Field>
            </div>
          </Section>

          <Section title="Fecha">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Noche del" error={errors.date}>
                {(p) => (
                  <input
                    {...p}
                    type="date"
                    value={draft.date}
                    onChange={(e) => set("date", e.target.value)}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Hora de inicio" error={errors.time}>
                {(p) => (
                  <input
                    {...p}
                    type="time"
                    value={draft.time}
                    onChange={(e) => set("time", e.target.value)}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field label="Ingreso" optional>
                {(p) => (
                  <input
                    {...p}
                    value={draft.doorsNote}
                    onChange={(e) => set("doorsNote", e.target.value)}
                    placeholder="Hasta las 3:00"
                    className={inputClass}
                  />
                )}
              </Field>
            </div>
            <p className="text-sm text-tenue" aria-live="polite">
              {preview ? (
                <>
                  Se muestra como: <span className="inline-block text-luz first-letter:uppercase">{preview}</span>
                </>
              ) : (
                "Si arranca de madrugada (por ejemplo, 00:30), elegí la noche anterior: el viernes, no el sábado."
              )}
            </p>
          </Section>

          <Section
            title="Entradas"
            description="Precio y cantidad de cada tipo. Podés sumar tandas (anticipada, 2ª tanda…)."
          >
            {errors.tickets && (
              <p role="alert" className="text-sm text-error">
                {errors.tickets}
              </p>
            )}
            {(["general", "vip"] as const).map((kind) => (
              <TicketGroup
                key={kind}
                kind={kind}
                tickets={draft.tickets.filter((t) => t.kind === kind)}
                errors={errors}
                onChange={setTicket}
                onAdd={() => addTicket(kind)}
                onRemove={removeTicket}
              />
            ))}
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Portada">
            <CoverInput value={draft.cover} onChange={(v) => set("cover", v)} />
          </Section>

          <Section title="Venta">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={draft.salesOpen}
                onChange={(e) => set("salesOpen", e.target.checked)}
                className="mt-0.5 size-5 accent-[var(--accent)]"
              />
              <span>
                <span className="block font-medium">Venta abierta</span>
                <span className="block text-sm text-tenue">
                  Si la desactivás, la fecha se ve pero no se pueden comprar entradas.
                </span>
              </span>
            </label>
          </Section>
        </div>
      </div>

      {/* Acciones: quedan pegadas abajo para no tener que volver a buscarlas. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col-reverse gap-2 border-t border-linea bg-noche/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6 lg:-mx-10 lg:px-10">
        <Link href={slug ? `/admin/eventos/${slug}` : "/admin/eventos"} className={buttonClass.secondary}>
          Cancelar
        </Link>
        <button type="submit" className={buttonClass.primary}>
          {isNew ? "Crear evento" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function TicketGroup({
  kind,
  tickets,
  errors,
  onChange,
  onAdd,
  onRemove,
}: {
  kind: TicketKind;
  tickets: DraftTicket[];
  errors: Errors;
  onChange: (id: string, patch: Partial<DraftTicket>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-linea p-4">
      <legend className="px-1 text-sm font-semibold">
        {kind === "vip" ? "Entradas VIP" : "Entradas comunes"}
      </legend>

      {tickets.length === 0 && (
        <p className="text-sm text-tenue">
          {kind === "vip" ? "Esta fecha no tiene VIP." : "Sin entradas comunes."}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {tickets.map((t) => {
          const key = `ticket.${t.id}`;
          const price = Number(t.price);
          return (
            <li key={t.id} className="grid gap-3 border-b border-linea pb-4 last:border-0 last:pb-0 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-start">
              <Field label="Nombre" error={errors[`${key}.name`]}>
                {(p) => (
                  <input
                    {...p}
                    value={t.name}
                    onChange={(e) => onChange(t.id, { name: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
              <Field
                label="Precio"
                error={errors[`${key}.price`]}
                hint={price > 0 ? formatPrice(price) : undefined}
              >
                {(p) => (
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-tenue" aria-hidden>
                      $
                    </span>
                    <input
                      {...p}
                      inputMode="numeric"
                      value={t.price}
                      onChange={(e) => onChange(t.id, { price: e.target.value })}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                )}
              </Field>
              <Field
                label="Cantidad"
                error={errors[`${key}.capacity`]}
                hint={t.sold > 0 ? `${t.sold} vendidas` : undefined}
              >
                {(p) => (
                  <input
                    {...p}
                    inputMode="numeric"
                    value={t.capacity}
                    onChange={(e) => onChange(t.id, { capacity: e.target.value })}
                    className={inputClass}
                  />
                )}
              </Field>
              {t.sold > 0 ? (
                // Con vendidas no se puede quitar: se puede bajar el cupo o pausar la venta.
                <p className="text-xs text-tenue sm:mt-9 sm:w-16">Con ventas</p>
              ) : (
                <button
                  type="button"
                  onClick={() => onRemove(t.id)}
                  aria-label={`Quitar ${t.name || "entrada"}`}
                  className={`${buttonClass.danger} px-3 sm:mt-7`}
                >
                  <TrashIcon />
                  <span className="sm:hidden">Quitar</span>
                </button>
              )}
              <div className="sm:col-span-4">
                <Field label="Qué incluye" optional>
                  {(p) => (
                    <input
                      {...p}
                      value={t.description}
                      onChange={(e) => onChange(t.id, { description: e.target.value })}
                      className={inputClass}
                    />
                  )}
                </Field>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent hover:underline"
      >
        <PlusIcon />
        {tickets.length === 0 ? `Agregar entrada ${kind === "vip" ? "VIP" : "común"}` : "Agregar tanda"}
      </button>
    </fieldset>
  );
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-linea bg-noche px-3 text-luz placeholder:text-tenue/60 hover:border-white/20 focus:border-accent focus:outline-none aria-[invalid=true]:border-error";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-tenue">{description}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </Card>
  );
}

type FieldProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/** Label, ayuda y error conectados al control por id. */
function Field({
  label,
  hint,
  error,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (props: FieldProps) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  // La ayuda se oculta cuando hay error: se describe con lo que está a la vista.
  const describedBy = error ? errorId : hint ? hintId : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-tenue"> (opcional)</span>}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error && (
        <p id={errorId} className="text-sm text-error">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-sm text-tenue">
          {hint}
        </p>
      )}
    </div>
  );
}
