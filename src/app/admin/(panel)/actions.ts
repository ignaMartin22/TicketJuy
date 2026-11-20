"use server";

import { redirect } from "next/navigation";
import { LOGIN_PATH, clearStaffSession } from "@/lib/staff-session";

/** Cierra la sesión del personal (borra la cookie del token) y vuelve al ingreso. */
export async function logoutStaff(): Promise<void> {
  await clearStaffSession();
  redirect(LOGIN_PATH);
}
