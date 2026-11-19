"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasLiveCatalog } from "@/lib/catalog";
import {
  SESSION_COOKIE,
  SESSION_PATH,
  doorAttendance,
  doorLogin,
  doorScan,
  getSession,
} from "@/lib/door";

export type LoginState = { error: string | null };

export type ScanOutcome =
  | { kind: "admitted"; holderName: string; ticketType: string }
  | { kind: "already_used"; holderName: string; ticketType: string; usedAt: string; usedBy: string | null }
  | { kind: "wrong_event"; title: string; startsAt: string }
  | { kind: "invalid" }
  | { kind: "error" }
  | { kind: "expired" };

async function clearSession() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: SESSION_PATH });
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!hasLiveCatalog()) return { error: "La portería necesita la API configurada." };
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { error: "Escribí tu usuario y tu contraseña." };

  const r = await doorLogin(username, password);
  if (!r.ok) {
    if (r.error === "invalid_credentials") return { error: "Usuario o contraseña incorrectos." };
    if (r.error === "not_door_staff") return { error: "Tu usuario no tiene permiso de portería." };
    if (r.error === "too_many_attempts") {
      const min = r.retryAfter ? Math.max(1, Math.ceil(r.retryAfter / 60)) : null;
      return {
        error: min
          ? `Demasiados intentos. Probá de nuevo en ${min} ${min === 1 ? "minuto" : "minutos"}.`
          : "Demasiados intentos. Esperá un rato y probá de nuevo.",
      };
    }
    return { error: "Sin conexión. Probá de nuevo." };
  }
  (await cookies()).set(SESSION_COOKIE, JSON.stringify({ token: r.token, venues: r.venues }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: SESSION_PATH,
    maxAge: r.expiresIn,
  });
  redirect("/puerta");
}

export async function logout() {
  await clearSession();
  redirect("/puerta");
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
