"use server";

import { redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import { getSession } from "@/lib/door";
import { rrppAddGuest, rrppList, type ListGuest, type PromoterList } from "@/lib/rrpp";
import { LOGIN_PATH, clearStaffSession } from "@/lib/staff-session";

export async function logout() {
  await clearStaffSession();
  redirect(LOGIN_PATH);
}

const MESSAGES: Record<string, string> = {
  already_on_list: "Ese mail ya tiene una entrada de lista para esta fecha.",
  quota_full: "La lista está completa.",
  list_closed: "La lista ya cerró.",
  invalid_email: "Revisá el mail.",
  invalid_name: "Revisá el nombre.",
  not_found: "Esa lista ya no existe.",
};

export type AddGuestState =
  | { status: "idle" }
  | { status: "ok"; guest: ListGuest; list: PromoterList; at: number }
  | { status: "error"; message: string; at: number }
  | { status: "expired" };

/** Agrega un invitado a la lista y devuelve el estado nuevo. 401 = sesión vencida: borra la cookie y avisa al cliente. */
export async function addGuest(id: string, name: string, email: string): Promise<AddGuestState> {
  const session = await getSession();
  if (!session || !hasLiveCatalog()) return { status: "expired" };
  const cleanName = String(name ?? "").trim();
  const cleanEmail = String(email ?? "").trim();
  if (!cleanName || cleanName.length > 120) return { status: "error", message: MESSAGES.invalid_name, at: Date.now() };
  if (!cleanEmail || cleanEmail.length > 254) return { status: "error", message: MESSAGES.invalid_email, at: Date.now() };
  const r = await rrppAddGuest(session, id, { name: cleanName, email: cleanEmail });
  if (r.ok) return { status: "ok", guest: r.guest, list: r.list, at: Date.now() };
  if (r.reason === "expired") {
    await clearStaffSession();
    return { status: "expired" };
  }
  return {
    status: "error",
    message: MESSAGES[r.reason] ?? "No pudimos agregarlo. Probá de nuevo.",
    at: Date.now(),
  };
}

export type ListOutcome =
  | { ok: true; list: PromoterList; guests: ListGuest[] }
  | { ok: false; expired: boolean };

/** Vuelve a leer la lista (por si otro celular o la puerta la cambió). */
export async function refreshList(id: string): Promise<ListOutcome> {
  const session = await getSession();
  if (!session) return { ok: false, expired: true };
  const r = await rrppList(session, id);
  if (r.ok) return { ok: true, list: r.data.list, guests: r.data.guests };
  if (r.reason === "expired") {
    await clearStaffSession();
    return { ok: false, expired: true };
  }
  return { ok: false, expired: false };
}
