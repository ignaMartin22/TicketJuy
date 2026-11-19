import { cookies } from "next/headers";
import { apiUrl } from "@/lib/catalog";

// API de portería de ticketera-core. Solo se usa desde el servidor de Next:
// el token vive en una cookie httpOnly y nunca llega al JavaScript del navegador.
// No importar desde componentes cliente.

export const SESSION_COOKIE = "puerta_session";
export const SESSION_PATH = "/puerta";

export type DoorVenue = { slug: string; name: string };
export type DoorEvent = { slug: string; title: string; startsAt: string };
export type DoorSession = { token: string; venues: DoorVenue[] };

export type ScanTicket = { id: string; ticketType: string; holderName: string; usedAt: string };
export type ScanResult =
  | { result: "admitted"; ticket: ScanTicket }
  | { result: "already_used"; ticket: ScanTicket & { usedBy: string | null } }
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

export type LoginOutcome =
  | { ok: true; token: string; expiresIn: number; venues: DoorVenue[] }
  | { ok: false; error: "invalid_credentials" | "not_door_staff" | "too_many_attempts" | "network"; retryAfter?: number };

export async function doorLogin(username: string, password: string): Promise<LoginOutcome> {
  let response: Response;
  try {
    response = await fetch(apiUrl("/api/v1/door/login/"), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  const data = (await response.json().catch(() => ({}))) as {
    token?: string;
    expiresIn?: number;
    venues?: DoorVenue[];
    error?: string;
    retryAfter?: number;
  };
  if (response.ok && data.token && data.expiresIn && Array.isArray(data.venues)) {
    return { ok: true, token: data.token, expiresIn: data.expiresIn, venues: data.venues };
  }
  if (response.status === 401) return { ok: false, error: "invalid_credentials" };
  if (response.status === 403) return { ok: false, error: "not_door_staff" };
  if (response.status === 429) {
    const retry = Number(data.retryAfter ?? response.headers.get("Retry-After"));
    return { ok: false, error: "too_many_attempts", retryAfter: Number.isFinite(retry) ? retry : undefined };
  }
  return { ok: false, error: "network" };
}

/** Sesión guardada en la cookie, o null si no hay o está mal formada. */
export async function getSession(): Promise<DoorSession | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as DoorSession;
    if (typeof s.token === "string" && Array.isArray(s.venues)) return s;
  } catch {}
  return null;
}

const seg = (...parts: string[]) => parts.map(encodeURIComponent).join("/");

async function call<T>(
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
