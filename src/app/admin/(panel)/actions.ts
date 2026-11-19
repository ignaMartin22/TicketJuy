"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STAFF_COOKIE } from "@/lib/staff-session";

/** Cierra la sesión del personal (borra la cookie del token) y vuelve al ingreso. */
export async function logoutStaff(): Promise<void> {
  (await cookies()).delete(STAFF_COOKIE);
  redirect("/admin/ingresar");
}
