"use client";

import { useSyncExternalStore } from "react";
import { events as mockEvents } from "@/lib/mock-data";
import * as api from "./server";
import type { AdminEvent } from "./types";

/*
 * Store del panel. Tiene dos modos:
 * - Real (con TICKETERA_API_URL): las fechas viven en ticketera-core y se leen y
 *   guardan por server actions (./server.ts) con el token del personal.
 * - Demo (sin API): se guardan en localStorage, con los datos de prueba de arranque.
 * El modo y el boliche los fija <PanelData> (admin-shell.tsx) al montar el panel.
 * El resto del panel usa las mismas funciones en los dos modos.
 */

// v2: el boliche pasó de "moon" a "infinity"; lo guardado antes se descarta.
const STORAGE_KEY = "tj-admin-events-v2";
/** Boliche de los datos de prueba del modo demo. */
const DEMO_VENUE = "infinity";

const SEED: AdminEvent[] = mockEvents
  .filter((e) => e.venueSlug === DEMO_VENUE)
  .map((e) => ({
    ...e,
    salesOpen: true,
    isPublished: true,
    ticketTypes: e.ticketTypes.map((t) => ({
      ...t,
      kind: t.id.includes("vip") ? "vip" : "general",
    })),
  }));

/** Mensaje para el dueño por cada código de error de la API de gestión. */
const MESSAGES: Record<string, string> = {
  expired: "La sesión venció. Volvé a entrar.",
  forbidden: "Tu usuario no administra este boliche.",
  venue_unavailable: "El boliche no está disponible.",
  event_unavailable: "Esa fecha ya no existe. Recargá la página.",
  has_sales: "Esta fecha ya vendió entradas: no se puede eliminar. Pausá la venta en su lugar.",
  has_orders: "Esta fecha ya tiene pedidos: no se puede eliminar. Pausá la venta en su lugar.",
  capacity_below_sales: "El cupo no puede quedar por debajo de lo vendido y reservado.",
  invalid_title: "Revisá el nombre del evento.",
  invalid_starts_at: "Revisá la fecha: tiene que ser a futuro.",
  invalid_lineup: "Revisá los artistas.",
  invalid_age_limit: "La edad mínima va de 0 a 99.",
  invalid_doors_note: "Revisá el texto de ingreso.",
  invalid_dress_code: "Revisá el dress code.",
  invalid_description: "Revisá la descripción.",
  invalid_ticket_types: "Revisá las entradas: tiene que haber al menos una y sin repetir.",
  invalid_name: "Revisá el nombre de las entradas.",
  invalid_price: "El precio de cada entrada tiene que ser mayor a 0.",
  invalid_capacity: "La cantidad de cada entrada tiene que ser mayor a 0 y no menor a lo vendido.",
  request_too_large: "Hay demasiado texto. Acortá la descripción.",
  invalid_cover: "La portada tiene que ser una foto JPG, PNG o WebP.",
  cover_too_large: "La portada es muy pesada. Probá con una foto más liviana.",
  network: "No pudimos conectar con el servidor. Probá de nuevo.",
};

/** Error de guardado con un mensaje listo para mostrarle al dueño. */
export class SaveError extends Error {
  constructor(public code: string) {
    super(MESSAGES[code] ?? MESSAGES.network);
  }
}

/**
 * La fecha se creó, pero la portada no se pudo subir. Lleva el slug para que el formulario
 * no la vuelva a crear: el próximo guardado es una edición.
 */
export class CoverError extends SaveError {
  constructor(
    code: string,
    public slug: string,
  ) {
    super(code);
    this.message = `La fecha se guardó, pero la portada no se pudo subir. ${this.message}`;
  }
}

/** "pending" hasta que <PanelData> diga si hay API: así no se ven los datos de prueba un instante. */
let mode: "pending" | "demo" | "live" = "pending";
let venue = DEMO_VENUE;
/** null = todavía cargando las fechas de la API. */
let cache: AdminEvent[] | null = null;
let loadError: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function expired() {
  // Navegación completa a propósito: el panel arranca de cero después de volver a entrar.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `/ingresar?desde=${encodeURIComponent(window.location.pathname)}&vencida=1`;
}

/** Lo llama <PanelData> al montar el panel: elige el modo y el boliche, y carga las fechas. */
export function startPanel(live: boolean, venueSlug: string) {
  if (mode === (live ? "live" : "demo") && venue === venueSlug && cache) return;
  mode = live ? "live" : "demo";
  venue = live ? venueSlug : DEMO_VENUE;
  cache = null;
  loadError = null;
  if (live) void reload();
  emit();
}

async function reload() {
  const r = await api.listEvents(venue).catch(() => ({ ok: false, error: "network" }) as const);
  if (!r.ok) {
    if (r.error === "expired") return expired();
    loadError = MESSAGES[r.error] ?? MESSAGES.network;
    cache = cache ?? [];
  } else {
    loadError = null;
    cache = r.data;
  }
  emit();
}

function read(): AdminEvent[] {
  if (mode === "pending") return EMPTY;
  if (mode === "live") return cache ?? EMPTY;
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cache = Array.isArray(parsed)
      ? (parsed as AdminEvent[]).map((e) => ({ ...e, isPublished: e.isPublished ?? true }))
      : SEED;
  } catch {
    cache = SEED;
  }
  return cache;
}
const EMPTY: AdminEvent[] = [];

function writeDemo(next: AdminEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      throw new SaveError("storage_full");
    }
    throw err;
  }
  cache = next;
  emit();
}
MESSAGES.storage_full = "No hay más espacio en este navegador. Probá con una foto de portada más liviana.";

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Modo demo: otra pestaña del panel guardó cambios.
  const onStorage = (e: StorageEvent) => {
    if (mode !== "demo" || e.key !== STORAGE_KEY) return;
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

/** true cuando las fechas están para mostrar (leído localStorage, o respondió la API). */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => mode === "demo" || (mode === "live" && cache !== null),
    () => false,
  );
}

/** Si el panel guarda en la API (true) o en este navegador (false). */
export function useLive() {
  return useSyncExternalStore(subscribe, () => mode === "live", () => false);
}

/** Error al cargar las fechas de la API, o null. */
export function useLoadError() {
  return useSyncExternalStore(subscribe, () => loadError, () => null);
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

/** Lanza SaveError con el mensaje para el dueño; si la sesión venció, manda al ingreso. */
function unwrap<T>(r: api.Result<T>): T {
  if (r.ok) return r.data;
  if (r.error === "expired") expired();
  throw new SaveError(r.error);
}

const payload = (input: EventInput): api.EventPayload => {
  // La portada va aparte (syncCover): es un archivo, no un campo del JSON.
  const { cover, ...rest } = input;
  void cover;
  return rest;
};

/**
 * Sube, cambia o saca la portada según lo que quedó en el formulario.
 * Una portada nueva llega como data URL (la achica cover-input); una que ya estaba, como su URL.
 */
async function syncCover(slug: string, next: string | undefined, prev: string | undefined) {
  if (next === prev) return;
  if (next?.startsWith("data:")) {
    const form = new FormData();
    form.append("file", await (await fetch(next)).blob());
    unwrap(await api.uploadCover(venue, slug, form));
  } else if (!next && prev) {
    unwrap(await api.removeCover(venue, slug));
  }
}

/** Crea el evento y devuelve su slug. */
export async function createEvent(input: EventInput): Promise<string> {
  if (mode === "live") {
    const slug = unwrap(await api.createEvent(venue, payload(input)));
    try {
      await syncCover(slug, input.cover, undefined);
    } catch (err) {
      await reload();
      if (err instanceof SaveError) throw new CoverError(err.code, slug);
      throw err;
    }
    await reload();
    return slug;
  }
  const list = read();
  const slug = uniqueSlug(slugify(input.title), new Set(list.map((e) => e.slug)));
  writeDemo(sortByDate([...list, { ...input, slug, venueSlug: DEMO_VENUE }]));
  return slug;
}

/**
 * El slug no cambia al editar: así no se rompen los links ya compartidos.
 * Las vendidas salen siempre de lo guardado, nunca del formulario.
 */
export async function updateEvent(slug: string, input: EventInput): Promise<void> {
  if (mode === "live") {
    const current = read().find((e) => e.slug === slug);
    const existing = current?.ticketTypes.map((t) => t.id) ?? [];
    unwrap(await api.updateEvent(venue, slug, payload(input), existing));
    try {
      await syncCover(slug, input.cover, current?.cover);
    } finally {
      await reload();
    }
    return;
  }
  writeDemo(
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

async function patch(slug: string, change: { salesOpen?: boolean; isPublished?: boolean }) {
  if (mode === "live") {
    unwrap(await api.patchEvent(venue, slug, change));
    await reload();
    return;
  }
  writeDemo(read().map((e) => (e.slug === slug ? { ...e, ...change } : e)));
}

export const setSalesOpen = (slug: string, salesOpen: boolean) => patch(slug, { salesOpen });
export const setPublished = (slug: string, isPublished: boolean) => patch(slug, { isPublished });

export async function deleteEvent(slug: string): Promise<void> {
  if (mode === "live") {
    unwrap(await api.deleteEvent(venue, slug));
    await reload();
    return;
  }
  writeDemo(read().filter((e) => e.slug !== slug));
}

/** Vuelve a los datos de prueba (solo modo demo). */
export function resetEvents() {
  if (mode === "live") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sin acceso a localStorage no hay nada guardado que borrar.
  }
  cache = SEED;
  emit();
}
