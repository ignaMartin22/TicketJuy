"use client";

import { useSyncExternalStore } from "react";
import { events as mockEvents } from "@/lib/mock-data";
import type { AdminEvent } from "./types";

/*
 * Store del panel, solo en el navegador.
 * PROVISORIO: hasta conectar Supabase, los eventos se guardan en localStorage
 * y arrancan con los datos de prueba del boliche. Cuando haya backend, este
 * archivo se reemplaza por llamadas a la API y el resto del panel no cambia.
 */

// v2: el boliche pasó de "moon" a "infinity"; lo guardado antes se descarta.
const STORAGE_KEY = "tj-admin-events-v2";
/** Por ahora el panel administra un solo boliche. */
export const ADMIN_VENUE_SLUG = "infinity";

const SEED: AdminEvent[] = mockEvents
  .filter((e) => e.venueSlug === ADMIN_VENUE_SLUG)
  .map((e) => ({
    ...e,
    salesOpen: true,
    ticketTypes: e.ticketTypes.map((t) => ({
      ...t,
      kind: t.id.includes("vip") ? "vip" : "general",
    })),
  }));

let cache: AdminEvent[] | null = null;
const listeners = new Set<() => void>();

function read(): AdminEvent[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cache = Array.isArray(parsed) ? (parsed as AdminEvent[]) : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
}

export class StorageFullError extends Error {
  constructor() {
    super(
      "No hay más espacio en este navegador. Probá con una foto de portada más liviana.",
    );
  }
}

function write(next: AdminEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      throw new StorageFullError();
    }
    throw err;
  }
  cache = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Otra pestaña del panel guardó cambios.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const sortByDate = (list: AdminEvent[]) =>
  [...list].sort((a, b) => a.startsAt.localeCompare(b.startsAt));

/** Eventos ordenados por fecha. En el servidor devuelve los de prueba. */
export function useAdminEvents() {
  return useSyncExternalStore(subscribe, read, () => SEED);
}

const noopSubscribe = () => () => {};

/**
 * false en el servidor y en la hidratación, true después.
 * Sirve para no mostrar "evento no encontrado" antes de leer localStorage.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function slugify(text: string) {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "evento"
  );
}

function uniqueSlug(base: string, taken: Set<string>) {
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export type EventInput = Omit<AdminEvent, "slug" | "venueSlug">;

/** Crea el evento y devuelve su slug. */
export function createEvent(input: EventInput) {
  const list = read();
  const slug = uniqueSlug(slugify(input.title), new Set(list.map((e) => e.slug)));
  write(sortByDate([...list, { ...input, slug, venueSlug: ADMIN_VENUE_SLUG }]));
  return slug;
}

/**
 * El slug no cambia al editar: así no se rompen los links ya compartidos.
 * Las vendidas salen siempre de lo guardado, nunca del formulario.
 */
export function updateEvent(slug: string, input: EventInput) {
  write(
    sortByDate(
      read().map((e) => {
        if (e.slug !== slug) return e;
        const soldById = new Map(e.ticketTypes.map((t) => [t.id, t.sold]));
        return {
          ...e,
          ...input,
          slug,
          venueSlug: e.venueSlug,
          ticketTypes: input.ticketTypes.map((t) => ({ ...t, sold: soldById.get(t.id) ?? 0 })),
        };
      }),
    ),
  );
}

export function setSalesOpen(slug: string, salesOpen: boolean) {
  write(read().map((e) => (e.slug === slug ? { ...e, salesOpen } : e)));
}

export function deleteEvent(slug: string) {
  write(read().filter((e) => e.slug !== slug));
}

/** Vuelve a los datos de prueba. */
export function resetEvents() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin acceso a localStorage no hay nada guardado que borrar.
  }
  cache = SEED;
  listeners.forEach((l) => l());
}
