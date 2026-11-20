import { call, seg, type Call, type DoorSession } from "@/lib/door";

// API de listas de RRPP de ticketera-core. Solo se usa desde el servidor de Next
// (mismo token de personal que la portería). No importar desde componentes cliente.

export type PromoterList = {
  id: string | number;
  name: string;
  promoter: { username: string; name: string };
  quota: number;
  issued: number;
  admitted: number;
  validUntil: string;
  isActive: boolean;
  event: { slug: string; title: string; startsAt: string; venueSlug: string; venueName: string };
};

export type ListGuest = { name: string; email: string; addedAt: string; usedAt: string | null };

/** La lista admite cargar gente: activa y antes de su hora límite. */
export function isOpen(list: PromoterList, now = Date.now()) {
  return list.isActive && new Date(list.validUntil).getTime() > now;
}

export async function rrppLists(session: DoorSession) {
  const r = await call<{ lists: PromoterList[] }>(session, "/api/v1/rrpp/lists/");
  return r.ok ? ({ ok: true, data: r.data.lists } as const) : r;
}

export function rrppList(session: DoorSession, id: string) {
  return call<{ list: PromoterList; guests: ListGuest[] }>(session, `/api/v1/rrpp/lists/${seg(id)}/`);
}

export type AddGuestResult =
  | { ok: true; guest: ListGuest; list: PromoterList }
  | { ok: false; reason: "expired" | "network" | "not_found" | string };

/** Agrega un invitado. Los errores de negocio (409/400) vuelven con el código de la API en `reason`. */
export async function rrppAddGuest(
  session: DoorSession,
  id: string,
  guest: { name: string; email: string },
): Promise<AddGuestResult> {
  const r = await call<{ guest: ListGuest; list: PromoterList } | { error: string }>(
    session,
    `/api/v1/rrpp/lists/${seg(id)}/guests/`,
    { method: "POST", body: guest },
    [201, 400, 404, 409],
  );
  if (!r.ok) return r;
  if ("error" in r.data && typeof r.data.error === "string") return { ok: false, reason: r.data.error };
  if ("guest" in r.data) return { ok: true, guest: r.data.guest, list: r.data.list };
  return { ok: false, reason: "network" };
}

export type { Call };
