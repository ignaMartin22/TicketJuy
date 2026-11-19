import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mismo valor que STAFF_COOKIE en src/lib/staff-session.ts; se repite porque
// el proxy no debe importar módulos que leen next/headers.
const STAFF_COOKIE = "tj_staff";

/**
 * Antes de cada ruta del panel:
 * - deja el path pedido en `x-tj-path` para que el guardián del layout arme `?desde=`,
 * - si falta la cookie de sesión, manda al ingreso sin esperar render ni API
 *   (la validación real del token la hace el guardián con auth/me).
 * Sin TICKETERA_API_URL el panel es demo y queda abierto.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const headers = new Headers(request.headers);
  headers.set("x-tj-path", pathname + search);

  if (pathname !== "/admin/ingresar" && process.env.TICKETERA_API_URL && !request.cookies.has(STAFF_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/ingresar";
    url.search = `?desde=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
