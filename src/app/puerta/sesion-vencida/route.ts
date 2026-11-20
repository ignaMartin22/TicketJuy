import { redirect } from "next/navigation";
import { LOGIN_PATH, clearStaffSession } from "@/lib/staff-session";

/** Las páginas no pueden borrar cookies: cuando la API da 401 mandan acá, que la borra y vuelve al ingreso. */
export async function GET() {
  await clearStaffSession();
  redirect(`${LOGIN_PATH}?desde=%2Fpuerta&vencida=1`);
}
