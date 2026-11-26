"use server";

import { cookies } from "next/headers";
import { updateTag } from "next/cache";
import { apiUrl, hasLiveCatalog, mediaUrl } from "@/lib/catalog";
import { STAFF_COOKIE } from "@/lib/staff-session";
import type { AdminEvent, AdminTicketType } from "./types";

/*
 * API de gestión de fechas de ticketera-core (/api/v1/manage/venues/<boliche>/events/).
 * Solo corre en el servidor de Next: el token del personal sale de la cookie httpOnly
 * y el navegador nunca habla con la API. El back decide si el usuario es admin de ese boliche.
 */

type ApiTicket = {
  id: string;
  name: string;
  kind: "common" | "vip";
  description: string;
  price: number;
  capacity: number;
  sold: number;
  reserved: number;
  isActive: boolean;
};
type ApiEvent = {
  slug: string;
  title: string;
  startsAt: string;
  isPublished: boolean;
  salesOpen: boolean;
  lineup?: string[];
  description?: string;
  doorsNote?: string;
  ageLimit?: number;
  dressCode?: string | null;
  cover?: string | null;
  ticketTypes?: ApiTicket[];
};

/** Lo que manda el formulario del panel. */
export type EventPayload = Omit<AdminEvent, "slug" | "venueSlug" | "cover">;

/** El código de error estable de la API, o "network" / "expired". */
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const seg = (s: string) => encodeURIComponent(s);
const base = (venue: string) => `/api/v1/manage/venues/${seg(venue)}/events/`;

async function call<T>(
  path: string,
  init: { method?: string; body?: unknown; form?: FormData } = {},
): Promise<Result<T>> {
  if (!hasLiveCatalog()) return { ok: false, error: "network" };
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) return { ok: false, error: "expired" };
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: init.method ?? "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        // Con FormData, fetch arma el Content-Type multipart con su boundary.
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
      signal: AbortSignal.timeout(init.form ? 30_000 : 15_000),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  if (response.status === 401) return { ok: false, error: "expired" };
  if (response.status === 204) return { ok: true, data: undefined as T };
  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (response.ok && data) return { ok: true, data };
  return { ok: false, error: data?.error ?? "network" };
}

function fromApi(venue: string, e: ApiEvent): AdminEvent {
  return {
    slug: e.slug,
    venueSlug: venue,
    title: e.title,
    lineup: e.lineup ?? [],
    description: e.description ?? "",
    startsAt: e.startsAt,
    doorsNote: e.doorsNote ?? "",
    ageLimit: e.ageLimit ?? 18,
    dressCode: e.dressCode ?? undefined,
    cover: mediaUrl(e.cover),
    salesOpen: e.salesOpen,
    isPublished: e.isPublished,
    ticketTypes: (e.ticketTypes ?? []).map(
      (t): AdminTicketType => ({
        id: t.id,
        kind: t.kind === "vip" ? "vip" : "general",
        name: t.name,
        description: t.description,
        price: t.price,
        capacity: t.capacity,
        sold: t.sold,
        isActive: t.isActive,
      }),
    ),
  };
}

function eventBody(input: EventPayload) {
  return {
    title: input.title,
    startsAt: input.startsAt,
    lineup: input.lineup,
    description: input.description,
    doorsNote: input.doorsNote,
    ageLimit: input.ageLimit,
    dressCode: input.dressCode ?? null,
    isPublished: input.isPublished,
    salesOpen: input.salesOpen,
  };
}

const ticketBody = (t: AdminTicketType) => ({
  name: t.name,
  kind: t.kind === "vip" ? "vip" : "common",
  description: t.description,
  price: t.price,
  capacity: t.capacity,
});

/** La web pública cachea el catálogo un minuto: se refresca apenas cambia algo. */
function refreshCatalog(venue: string) {
  updateTag(`venue:${venue}`);
}

/** Todas las fechas del boliche (borradores y finalizadas incluidas), con sus entradas. */
export async function listEvents(venue: string): Promise<Result<AdminEvent[]>> {
  const list = await call<{ events: ApiEvent[] }>(base(venue));
  if (!list.ok) return list;
  // El listado no trae las entradas: se pide el detalle de cada fecha, en paralelo.
  const details = await Promise.all(list.data.events.map((e) => call<{ event: ApiEvent }>(`${base(venue)}${seg(e.slug)}/`)));
  const failed = details.find((d) => !d.ok);
  if (failed && !failed.ok) return failed;
  const events = details.map((d) => fromApi(venue, (d as { ok: true; data: { event: ApiEvent } }).data.event));
  return { ok: true, data: events.sort((a, b) => a.startsAt.localeCompare(b.startsAt)) };
}

export async function createEvent(venue: string, input: EventPayload): Promise<Result<string>> {
  const r = await call<{ event: ApiEvent }>(base(venue), {
    method: "POST",
    body: { ...eventBody(input), ticketTypes: input.ticketTypes.map(ticketBody) },
  });
  if (!r.ok) return r;
  refreshCatalog(venue);
  return { ok: true, data: r.data.event.slug };
}

/**
 * Edita la fecha. Las entradas que ya existían van con su `slug`; las nuevas, sin él;
 * las que se quitaron en el formulario se desactivan (la API no borra tipos de entrada).
 */
export async function updateEvent(
  venue: string,
  slug: string,
  input: EventPayload,
  existingIds: string[],
): Promise<Result<string>> {
  const kept = new Set(input.ticketTypes.map((t) => t.id));
  const ticketTypes = [
    ...input.ticketTypes.map((t) => (existingIds.includes(t.id) ? { slug: t.id, ...ticketBody(t), isActive: true } : ticketBody(t))),
    ...existingIds.filter((id) => !kept.has(id)).map((id) => ({ slug: id, isActive: false })),
  ];
  const r = await call<{ event: ApiEvent }>(`${base(venue)}${seg(slug)}/`, {
    method: "PATCH",
    body: { ...eventBody(input), ticketTypes },
  });
  if (!r.ok) return r;
  refreshCatalog(venue);
  return { ok: true, data: slug };
}

/** Pausa o reanuda la venta, o publica / pasa a borrador. */
export async function patchEvent(
  venue: string,
  slug: string,
  patch: { salesOpen?: boolean; isPublished?: boolean },
): Promise<Result<null>> {
  const r = await call<{ event: ApiEvent }>(`${base(venue)}${seg(slug)}/`, { method: "PATCH", body: patch });
  if (!r.ok) return r;
  refreshCatalog(venue);
  return { ok: true, data: null };
}

export async function deleteEvent(venue: string, slug: string): Promise<Result<null>> {
  const r = await call<null>(`${base(venue)}${seg(slug)}/`, { method: "DELETE" });
  if (!r.ok) return r;
  refreshCatalog(venue);
  return { ok: true, data: null };
}

/** Sube la portada (el archivo va en `file`). Devuelve la URL nueva. */
export async function uploadCover(venue: string, slug: string, form: FormData): Promise<Result<string | undefined>> {
  const file = form.get("file");
  if (!(file instanceof Blob)) return { ok: false, error: "invalid_cover" };
  const body = new FormData();
  body.append("file", file, "portada.jpg");
  const r = await call<{ cover: string | null }>(`${base(venue)}${seg(slug)}/cover/`, { method: "POST", form: body });
  if (!r.ok) return r;
  refreshCatalog(venue);
  return { ok: true, data: mediaUrl(r.data.cover) };
}

export async function removeCover(venue: string, slug: string): Promise<Result<null>> {
  const r = await call<{ cover: null }>(`${base(venue)}${seg(slug)}/cover/`, { method: "DELETE" });
  if (!r.ok) return r;
  refreshCatalog(venue);
  return { ok: true, data: null };
}

/*
 * Cuentas de cobro del boliche (/api/v1/manage/venues/<boliche>/payment-accounts/ y
 * .../mercadopago/). Las claves secretas van del formulario al back y nunca vuelven.
 */

export type GatewayProvider = "macro" | "nave";

export type GatewayStatus = {
  available: boolean;
  connected: boolean;
  liveMode: boolean | null;
  accountId: string;
  connectedAt: string | null;
  fields: { name: string; label: string; secret: boolean; required: boolean }[];
};

export type PaymentAccounts = {
  mercadopago: {
    available: boolean;
    connected: boolean;
    needsReconnect: boolean;
    direct: boolean;
    liveMode: boolean | null;
    connectedAt: string | null;
  };
  macro: GatewayStatus;
  nave: GatewayStatus;
};

const accounts = (venue: string) => `/api/v1/manage/venues/${seg(venue)}/payment-accounts/`;
const isGateway = (p: string): p is GatewayProvider => p === "macro" || p === "nave";

export async function getPaymentAccounts(venue: string): Promise<Result<PaymentAccounts>> {
  return call<PaymentAccounts>(accounts(venue));
}

/** El link de autorización de Mercado Pago, solo si es de Mercado Pago. */
export async function connectMercadoPago(venue: string): Promise<Result<string>> {
  const result = await call<{ authorizationUrl: string }>(
    `/api/v1/manage/venues/${seg(venue)}/mercadopago/connect/`,
    { method: "POST" },
  );
  if (!result.ok) return result;
  try {
    const url = new URL(result.data.authorizationUrl);
    const mp = url.hostname === "mercadopago.com.ar" || url.hostname.endsWith(".mercadopago.com.ar") ||
      url.hostname === "mercadopago.com" || url.hostname.endsWith(".mercadopago.com");
    if (url.protocol === "https:" && mp) return { ok: true, data: url.toString() };
  } catch {}
  return { ok: false, error: "network" };
}

export async function disconnectMercadoPago(venue: string): Promise<Result<null>> {
  return call<null>(`/api/v1/manage/venues/${seg(venue)}/mercadopago/`, { method: "DELETE" });
}

export async function saveGateway(
  venue: string,
  provider: string,
  values: Record<string, string>,
  liveMode: boolean,
): Promise<Result<PaymentAccounts>> {
  if (!isGateway(provider)) return { ok: false, error: "not_found" };
  const body: Record<string, string | boolean> = { liveMode };
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") body[key] = value;
  }
  return call<PaymentAccounts>(`${accounts(venue)}${provider}/`, { method: "PUT", body });
}

export async function removeGateway(venue: string, provider: string): Promise<Result<null>> {
  if (!isGateway(provider)) return { ok: false, error: "not_found" };
  return call<null>(`${accounts(venue)}${provider}/`, { method: "DELETE" });
}
