"use server";

import { cookies } from "next/headers";
import { apiUrl, hasLiveCatalog } from "@/lib/catalog";
import type { PromoterList } from "@/lib/rrpp";
import { STAFF_COOKIE } from "@/lib/staff-session";

/*
 * Listas de RRPP de una fecha (API de gestión de ticketera-core). Solo corre en el servidor
 * de Next: el token sale de la cookie httpOnly. El back decide si el usuario administra el boliche.
 */

export type Promoter = { username: string; name: string };
/** El código de error estable de la API, o "network" / "expired". */
export type ListResult<T> = { ok: true; data: T } | { ok: false; error: string };

const seg = encodeURIComponent;
const listsPath = (venue: string, event: string) => `/api/v1/manage/venues/${seg(venue)}/events/${seg(event)}/lists/`;

async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<ListResult<T>> {
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
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  if (response.status === 401) return { ok: false, error: "expired" };
  const data = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (response.ok && data) return { ok: true, data };
  return { ok: false, error: data?.error ?? "network" };
}

export async function listPromoterLists(venue: string, event: string): Promise<ListResult<PromoterList[]>> {
  const r = await call<{ lists: PromoterList[] }>(listsPath(venue, event));
  return r.ok ? { ok: true, data: r.data.lists } : r;
}

export async function listPromoters(venue: string): Promise<ListResult<Promoter[]>> {
  const r = await call<{ promoters: Promoter[] }>(`/api/v1/manage/venues/${seg(venue)}/rrpp/`);
  return r.ok ? { ok: true, data: r.data.promoters } : r;
}

export async function createPromoterList(
  venue: string,
  event: string,
  input: { name: string; promoterUsername: string; quota: number; validUntil: string },
): Promise<ListResult<PromoterList>> {
  const r = await call<{ list: PromoterList }>(listsPath(venue, event), { method: "POST", body: input });
  return r.ok ? { ok: true, data: r.data.list } : r;
}

export async function updatePromoterList(
  venue: string,
  event: string,
  id: string | number,
  patch: { name?: string; quota?: number; validUntil?: string; isActive?: boolean },
): Promise<ListResult<PromoterList>> {
  const r = await call<{ list: PromoterList }>(`${listsPath(venue, event)}${seg(String(id))}/`, { method: "PATCH", body: patch });
  return r.ok ? { ok: true, data: r.data.list } : r;
}
