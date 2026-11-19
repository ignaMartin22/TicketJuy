import { cookies } from "next/headers";
import { apiUrl, hasLiveCatalog } from "@/lib/catalog";

// Sesión del personal de los boliches contra ticketera-core.
// El token viaja en una cookie httpOnly que solo lee el servidor de Next;
// la API la recibe como `Authorization: Bearer <token>` y dura 12 horas.
// Contrato: POST /api/v1/auth/login/ y GET /api/v1/auth/me/ (docs/integracion-front.md del core).

export const STAFF_COOKIE = "tj_staff";

export type StaffRole = "admin" | "door" | "cashier";

export type StaffMembership = {
  venue: { slug: string; name: string };
  role: StaffRole;
};

export type StaffSession = {
  username: string;
  memberships: StaffMembership[];
};

/**
 * Sesión actual: lee la cookie y la valida con la API.
 * `use cache: private` guarda el resultado solo en el navegador, así navegar
 * dentro del panel no vuelve a pedir `auth/me` en cada cambio de ruta.
 * null = sin sesión (falta la cookie, el token venció o la API no responde).
 */
export async function getStaffSession(): Promise<StaffSession | null> {
  "use cache: private";
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token || !hasLiveCatalog()) return null;
  try {
    const response = await fetch(apiUrl("/api/v1/auth/me/"), {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      user: { username: string };
      memberships: StaffMembership[];
    };
    return { username: data.user.username, memberships: data.memberships };
  } catch {
    return null;
  }
}

/** Sesión de demostración: sin API configurada el panel queda abierto. */
export function demoSession(): StaffSession {
  return {
    username: "demo",
    memberships: [{ venue: { slug: "infinity", name: "Infinity" }, role: "admin" }],
  };
}

/**
 * La membresía de administración que opera el panel: la del boliche indicado
 * si el usuario la tiene, si no la primera de rol `admin`. null = no administra.
 */
export function panelMembership(session: StaffSession, preferredSlug?: string): StaffMembership | null {
  const admins = session.memberships.filter((m) => m.role === "admin");
  return (preferredSlug && admins.find((m) => m.venue.slug === preferredSlug)) || admins[0] || null;
}
