"use server";

import { redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import { doorAttendance, doorScan, getSession } from "@/lib/door";
import { LOGIN_PATH, clearStaffSession } from "@/lib/staff-session";

export type ScanOutcome =
  | { kind: "admitted"; holderName: string; ticketType: string }
  | { kind: "already_used"; holderName: string; ticketType: string; usedAt: string; usedBy: string | null }
  | { kind: "void"; holderName: string; ticketType: string }
  | { kind: "list_closed"; holderName: string; ticketType: string; validUntil: string }
  | { kind: "wrong_event"; title: string; startsAt: string }
  | { kind: "invalid" }
  | { kind: "error" }
  | { kind: "expired" };

const clearSession = clearStaffSession;

/** Sale de la cuenta del personal (es la misma del panel) y vuelve al ingreso. */
export async function logout() {
  await clearStaffSession();
  redirect(LOGIN_PATH);
}

/** Quema la entrada del QR. Si la sesión venció, borra la cookie y avisa al cliente. */
export async function scan(venue: string, event: string, text: string): Promise<ScanOutcome> {
  const session = await getSession();
  const code = String(text ?? "").trim();
  if (!session || !hasLiveCatalog()) return { kind: "expired" };
  if (!code || code.length > 4096) return { kind: "invalid" };
  const r = await doorScan(session, venue, event, code);
  if (!r.ok) {
    if (r.reason === "expired") {
      await clearSession();
      return { kind: "expired" };
    }
    return { kind: "error" };
  }
  const d = r.data;
  switch (d.result) {
    case "admitted":
      return { kind: "admitted", holderName: d.ticket.holderName, ticketType: d.ticket.ticketType };
    case "already_used":
      return {
        kind: "already_used",
        holderName: d.ticket.holderName,
        ticketType: d.ticket.ticketType,
        usedAt: d.ticket.usedAt,
        usedBy: d.ticket.usedBy ?? null,
      };
    case "void":
      return { kind: "void", holderName: d.ticket.holderName, ticketType: d.ticket.ticketType };
    case "list_closed":
      return {
        kind: "list_closed",
        holderName: d.ticket.holderName,
        ticketType: d.ticket.ticketType,
        validUntil: d.ticket.validUntil,
      };
    case "wrong_event":
      return { kind: "wrong_event", title: d.event.title, startsAt: d.event.startsAt };
    case "invalid":
      return { kind: "invalid" };
    default:
      return { kind: "error" };
  }
}

export type CountsOutcome = { ok: true; admitted: number; issued: number } | { ok: false; expired: boolean };

export async function counts(venue: string, event: string): Promise<CountsOutcome> {
  const session = await getSession();
  if (!session) return { ok: false, expired: true };
  const r = await doorAttendance(session, venue, event);
  if (r.ok) return { ok: true, admitted: r.data.admitted, issued: r.data.issued };
  if (r.reason === "expired") {
    await clearSession();
    return { ok: false, expired: true };
  }
  return { ok: false, expired: false };
}
