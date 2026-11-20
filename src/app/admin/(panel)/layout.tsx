import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HOME_VENUE, hasLiveCatalog } from "@/lib/catalog";
import { demoSession, getStaffSession, panelMembership } from "@/lib/staff-session";
import { AdminShell } from "../_components/admin-shell";
import { SinAcceso } from "./sin-acceso";

/** Las pantallas del panel, con el menú. El ingreso (/ingresar) queda afuera. */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh flex-1 items-center justify-center text-tenue">Cargando…</div>
      }
    >
      <PanelGuard>{children}</PanelGuard>
    </Suspense>
  );
}

/**
 * Guardián del panel: valida la sesión del personal (cookie + auth/me).
 * Va detrás del Suspense porque la sesión se lee en cada request
 * (`use cache: private` en getStaffSession); afuera queda la cascara estática.
 */
async function PanelGuard({ children }: { children: React.ReactNode }) {
  // Sin API el panel queda abierto con la sesión de demostración.
  if (!hasLiveCatalog()) {
    const session = demoSession();
    return (
      <AdminShell session={session} membership={panelMembership(session)!} demo>
        {children}
      </AdminShell>
    );
  }
  const session = await getStaffSession();
  if (!session) {
    // El proxy deja el path pedido en x-tj-path para volver después del ingreso.
    const path = (await headers()).get("x-tj-path") ?? "/admin";
    redirect(`/ingresar?desde=${encodeURIComponent(path)}`);
  }
  const membership = panelMembership(session, HOME_VENUE);
  if (!membership) {
    // Puerta sin administración: su lugar es el escáner, no el panel.
    if (session.memberships.some((m) => m.role === "door")) redirect("/puerta");
    if (session.memberships.some((m) => m.role === "rrpp")) redirect("/rrpp");
    return <SinAcceso session={session} />;
  }
  return (
    <AdminShell session={session} membership={membership}>
      {children}
    </AdminShell>
  );
}
