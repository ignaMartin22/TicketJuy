import { frontKeyHeaders } from "@/lib/api-headers";
import { cookies } from "next/headers";
import { apiUrl } from "@/lib/catalog";
import { STAFF_COOKIE } from "@/lib/staff-session";

// API de portería de ticketera-core. Solo se usa desde el servidor de Next:
// el token vive en una cookie httpOnly y nunca llega al JavaScript del navegador.
// No importar desde componentes cliente.

export type DoorVenue = { slug: string; name: string };
export type DoorEvent = { slug: string; title: string; startsAt: string };
/** La sesión de la portería es la del personal: solo hace falta el token. */
export type DoorSession = { token: string };

export type ScanTicket = { id: string; ticketType: string; holderName: string; usedAt: string };
export type ScanResult =
  | { result: "admitted"; ticket: ScanTicket }
  | { result: "already_used"; ticket: ScanTicket & { usedBy: string | null } }
  | { result: "list_closed"; ticket: { holderName: string; ticketType: string; validUntil: string } }
  | { result: "wrong_event"; event: DoorEvent }
  | { result: "invalid" };

export type Attendance = {
  event: DoorEvent;
  issued: number;
  admitted: number;
  ticketTypes: { id: string; name: string; issued: number; admitted: number }[];
  tickets: {
    id: string;
    holderName: string;
    ticketType: string;
    usedAt: string | null;
    usedBy: string | null;
  }[];
};

/** Resultado de una llamada autenticada. "expired" = la API dio 401; "network" = sin respuesta o error del servidor. */
export type Call<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "expired" | "network" | "not_found" };

/** Sesión del personal guardada en la cookie, o null si no hay. Sin llamadas a la API: escanear sigue siendo rápido. */
export async function getSession(): Promise<DoorSession | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  return token ? { token } : null;
}

export const seg = (...parts: string[]) => parts.map(encodeURIComponent).join("/");

export async function call<T>(
  session: DoorSession,
  path: string,
  init: { method?: string; body?: unknown } = {},
  accept: number[] = [200],
): Promise<Call<T>> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: init.method ?? "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...frontKeyHeaders(),
        Authorization: `Bearer ${session.token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, reason: "network" };
  }
  if (response.status === 401) return { ok: false, reason: "expired" };
  const data = (await response.json().catch(() => null)) as T | null;
  if (data && accept.includes(response.status)) return { ok: true, data };
  if (response.status === 404 && !accept.includes(404)) return { ok: false, reason: "not_found" };
  return { ok: false, reason: "network" };
}

/** Los boliches donde el usuario puede hacer portería (rol puerta o administración), leídos de auth/me; `rrpp` = además tiene listas. */
export async function doorVenues(session: DoorSession) {
  const r = await call<{ memberships: { venue: DoorVenue; role: string }[] }>(session, "/api/v1/auth/me/");
  if (!r.ok) return r;
  const venues = new Map<string, DoorVenue>();
  for (const m of r.data.memberships) {
    if (m.role === "door" || m.role === "admin") venues.set(m.venue.slug, m.venue);
  }
  const rrpp = r.data.memberships.some((m) => m.role === "rrpp");
  return { ok: true, data: { venues: [...venues.values()], rrpp } } as const;
}

export async function doorEvents(session: DoorSession, venue: string) {
  const r = await call<{ events: DoorEvent[] }>(session, `/api/v1/door/venues/${seg(venue)}/events/`);
  return r.ok ? ({ ok: true, data: r.data.events } as const) : r;
}

export function doorScan(session: DoorSession, venue: string, event: string, token: string) {
  return call<ScanResult>(
    session,
    `/api/v1/door/venues/${seg(venue)}/events/${seg(event)}/scan/`,
    { method: "POST", body: { token } },
    [200, 404, 409],
  );
}

export function doorAttendance(session: DoorSession, venue: string, event: string) {
  return call<Attendance>(session, `/api/v1/door/venues/${seg(venue)}/events/${seg(event)}/attendance/`);
}
