"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { buyerHeaders } from "@/lib/api-headers";
import { apiUrl, assertConfigured, hasLiveCatalog } from "@/lib/catalog";
import { STAFF_COOKIE, canReturnTo, homeFor, type StaffMembership } from "@/lib/staff-session";

export type LoginState = { error: string } | undefined;

type LoginResponse = { token?: string; expiresIn?: number; memberships?: StaffMembership[] };

/**
 * Ingreso único del personal contra ticketera-core (POST /api/v1/auth/login/).
 * El token queda en una cookie httpOnly que solo lee el servidor de Next, y la
 * usan el panel y la portería. Después de entrar, cada uno va a lo suyo:
 * administración al panel, puerta al escáner (o a la pantalla que había pedido,
 * si su rol la permite). Sin API configurada el panel entra en modo demo.
 */
export async function loginStaff(prev: LoginState, formData: FormData): Promise<LoginState> {
  const desde = formData.get("desde");
  const pedido = typeof desde === "string" ? desde : "";

  assertConfigured();
  if (!hasLiveCatalog()) redirect(pedido.startsWith("/admin") && !pedido.startsWith("//") ? pedido : "/admin");

  const usuario = formData.get("usuario");
  const clave = formData.get("clave");
  if (
    typeof usuario !== "string" ||
    typeof clave !== "string" ||
    !usuario.trim() ||
    !clave
  ) {
    return { error: "Completá usuario y contraseña." };
  }

  let response: Response;
  try {
    response = await fetch(apiUrl("/api/v1/auth/login/"), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(await buyerHeaders()) },
      body: JSON.stringify({ username: usuario.trim(), password: clave }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { error: "No se pudo conectar con el servidor. Probá de nuevo." };
  }

  if (response.ok) {
    const data = (await response.json().catch(() => ({}))) as LoginResponse;
    if (!data.token) return { error: "No se pudo conectar con el servidor. Probá de nuevo." };
    const memberships = Array.isArray(data.memberships) ? data.memberships : [];
    (await cookies()).set(STAFF_COOKIE, data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.expiresIn ?? 43200,
    });
    redirect(canReturnTo(pedido, memberships) ? pedido : homeFor(memberships));
  }

  if (response.status === 401) return { error: "Usuario o contraseña incorrectos." };
  if (response.status === 403)
    return { error: "Tu usuario no tiene acceso a ningún boliche activo." };
  if (response.status === 429) {
    const data = (await response.json().catch(() => ({}))) as { retryAfter?: number };
    return {
      error: `Demasiados intentos. Probá de nuevo en ${Math.ceil((data.retryAfter ?? 60) / 60)} min.`,
    };
  }
  return { error: "No se pudo conectar con el servidor. Probá de nuevo." };
}
