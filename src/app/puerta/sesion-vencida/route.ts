import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_PATH } from "@/lib/door";

/** Las páginas no pueden borrar cookies: cuando la API da 401 mandan acá, que la borra y vuelve al login. */
export async function GET() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: SESSION_PATH });
  redirect("/puerta?vencida=1");
}
