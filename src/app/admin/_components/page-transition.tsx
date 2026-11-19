"use client";

import { usePathname } from "next/navigation";
import { Suspense, ViewTransition, type ReactNode } from "react";

/*
 * Transición entre las pestañas del panel. El menú se queda quieto y sólo cambia
 * el contenido: si vas a una pestaña de más abajo en el menú, el contenido nuevo
 * sube; si vas a una de más arriba, baja (ver transitionTypes en admin-shell).
 * El resto de las navegaciones (entrar a un evento, volver) hace un fundido.
 * Las animaciones están en globals.css (.adm-sube, .adm-baja, .adm-fundido).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  // usePathname puede suspender en rutas con params (cacheComponents): sin transición mientras tanto.
  return (
    <Suspense fallback={children}>
      <Keyed>{children}</Keyed>
    </Suspense>
  );
}

const MOTION = { "adm-sube": "adm-sube", "adm-baja": "adm-baja", default: "adm-fundido" };

function Keyed({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter={MOTION} exit={MOTION} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
