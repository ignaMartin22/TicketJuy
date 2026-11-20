"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import type { ListGuest, PromoterList } from "@/lib/rrpp";
import { formatTime } from "../../puerta/time";
import { addGuest } from "../actions";

const field =
  "mt-1.5 block min-h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-base text-luz outline-none transition-colors placeholder:text-white/30 focus:border-[color-mix(in_oklab,var(--magenta)_70%,transparent)] focus:bg-white/[0.06] disabled:opacity-50";

/** Formulario para anotar gente y la lista de anotados (más nuevos primero). */
export function GuestBoard({
  id,
  initialList,
  initialGuests,
  initialClosed,
}: {
  id: string;
  initialList: PromoterList;
  initialGuests: ListGuest[];
  initialClosed: boolean;
}) {
  const [list, setList] = useState(initialList);
  const [guests, setGuests] = useState(initialGuests);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // `closed` lo calcula el servidor al cargar; si cierra con la pantalla abierta, la API lo avisa con list_closed.
  const [closed, setClosed] = useState(initialClosed);
  const open = list.isActive && !closed;
  const full = list.issued >= list.quota;

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("nombre") ?? "");
    const email = String(data.get("mail") ?? "");
    setError(null);
    startTransition(async () => {
      const r = await addGuest(id, name, email);
      if (r.status === "expired") {
        // Navegación completa: la ruta borra la cookie y vuelve al ingreso.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/rrpp/sesion-vencida";
        return;
      }
      if (r.status === "error") {
        if (r.message === "La lista ya cerró.") setClosed(true);
        setError(r.message);
        return;
      }
      if (r.status === "ok") {
        setList(r.list);
        setGuests((g) => [r.guest, ...g]);
        formRef.current?.reset();
        nameRef.current?.focus();
      }
    });
  }

  return (
    <>
      <h1 className="display mt-3 text-4xl">{list.name}</h1>
      <p className="mt-1 text-tenue">
        {list.event.title} · {list.event.venueName}
      </p>
      <p className="mt-3 text-lg font-semibold tabular-nums">
        {list.issued} de {list.quota} anotados
        <span className="font-normal text-tenue"> · {list.admitted} ingresaron</span>
      </p>
      <p className="text-sm text-tenue tabular-nums">
        {!list.isActive ? "Lista pausada" : open ? `Cierra a las ${formatTime(list.validUntil)}` : `Cerró a las ${formatTime(list.validUntil)}`}
      </p>

      {open && !full ? (
        <form ref={formRef} onSubmit={onSubmit} className="panel mt-6 flex flex-col gap-4 rounded-2xl p-4">
          <label className="block text-sm font-medium text-white/80">
            Nombre
            <input
              ref={nameRef}
              name="nombre"
              required
              maxLength={120}
              autoComplete="off"
              autoCapitalize="words"
              enterKeyHint="next"
              className={field}
              disabled={pending}
            />
          </label>
          <label className="block text-sm font-medium text-white/80">
            Mail
            <input
              name="mail"
              type="email"
              required
              maxLength={254}
              autoComplete="off"
              autoCapitalize="none"
              inputMode="email"
              spellCheck={false}
              enterKeyHint="send"
              className={field}
              disabled={pending}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="min-h-12 rounded-full bg-luz font-semibold text-noche transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Agregando…" : "Agregar"}
          </button>
          <p className="text-sm text-tenue">Le llega la entrada con el QR por mail.</p>
        </form>
      ) : (
        <p className="panel mt-6 rounded-2xl p-4 text-tenue">
          {!list.isActive
            ? "La lista está pausada: no se puede agregar gente."
            : full
              ? "La lista está completa."
              : "La lista ya cerró."}
        </p>
      )}

      <h2 className="mt-8 text-lg font-semibold">Anotados</h2>
      {guests.length === 0 ? (
        <p className="mt-2 text-tenue">Todavía no anotaste a nadie.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {guests.map((g) => (
            <li key={`${g.email}-${g.addedAt}`} className="panel flex min-h-14 items-center justify-between gap-3 rounded-xl px-4 py-2">
              <span className="min-w-0">
                <span className="block truncate font-medium">{g.name}</span>
                <span className="block truncate text-sm text-tenue">{g.email}</span>
              </span>
              {g.usedAt && (
                <span className="shrink-0 rounded-full border border-emerald-300/40 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  Ingresó
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
