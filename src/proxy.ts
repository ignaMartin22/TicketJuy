import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mismo valor que STAFF_COOKIE y LOGIN_PATH en src/lib/staff-session.ts; se repiten
// porque el proxy no debe importar módulos que leen next/headers.
const STAFF_COOKIE = "tj_staff";
const LOGIN_PATH = "/ingresar";

/** Rutas del personal que se pueden abrir sin sesión. */
const OPEN = ["/admin/ingresar", "/puerta/sesion-vencida"];

/**
 * Antes de cada ruta del panel y de la portería:
 * - deja el path pedido en `x-tj-path` para que el guardián del panel arme `?desde=`,
 * - si falta la cookie de sesión, manda al ingreso único sin esperar render ni API
 *   (la validación real del token la hacen el panel con auth/me y la portería con la API).
 * Sin TICKETERA_API_URL el panel es demo y queda abierto.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const headers = new Headers(request.headers);
  headers.set("x-tj-path", pathname + search);

  if (!OPEN.includes(pathname) && process.env.TICKETERA_API_URL && !request.cookies.has(STAFF_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.search = `?desde=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/admin", "/admin/:path*", "/puerta", "/puerta/:path*"] };
