"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useRef, useState, type ReactNode } from "react";
import { getVenue } from "@/lib/mock-data";
import { ADMIN_VENUE_SLUG, resetEvents } from "../_lib/store";
import { ConfirmDialog } from "./confirm-dialog";
import { PageTransition } from "./page-transition";
import { CalendarIcon, ChartIcon, CloseIcon, MenuIcon, PlusIcon } from "./icons";

const VENUE_NAME = getVenue(ADMIN_VENUE_SLUG)?.name ?? "Boliche";

const NAV = [
  { href: "/admin", label: "Resumen", icon: ChartIcon },
  { href: "/admin/eventos", label: "Eventos", icon: CalendarIcon },
  { href: "/admin/eventos/nuevo", label: "Nuevo evento", icon: PlusIcon },
] as const;

function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/eventos") {
    return pathname.startsWith("/admin/eventos") && pathname !== "/admin/eventos/nuevo";
  }
  return pathname === href;
}

/**
 * Sidebar fijo en PC; en celular, barra arriba con un menú que se abre como
 * <dialog> (trae foco atrapado, Escape y fondo).
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const drawer = useRef<HTMLDialogElement>(null);
  const close = () => drawer.current?.close();

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Celular y tablet */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-linea bg-noche/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => drawer.current?.showModal()}
          className="-mr-2 flex size-11 items-center justify-center rounded-lg text-tenue hover:text-luz"
          aria-label="Abrir menú"
        >
          <MenuIcon />
        </button>
      </header>

      <dialog
        ref={drawer}
        aria-label="Menú del panel"
        // Click en el fondo (fuera del panel) cierra.
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-noche-2 p-0 text-luz backdrop:bg-black/60 backdrop:backdrop-blur-sm lg:hidden"
      >
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between">
            <Brand onNavigate={close} />
            <button
              type="button"
              onClick={close}
              className="-mr-2 flex size-11 items-center justify-center rounded-lg text-tenue hover:text-luz"
              aria-label="Cerrar menú"
            >
              <CloseIcon />
            </button>
          </div>
          <SidebarBody onNavigate={close} />
        </div>
      </dialog>

      {/* PC */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-linea bg-noche-2/60 p-5 lg:flex">
        <Brand />
        <SidebarBody />
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5">
      <span className="neon-soft size-2 rounded-full bg-accent" aria-hidden />
      <span className="leading-tight">
        <span className="block text-sm font-semibold">{VENUE_NAME}</span>
        <span className="block text-xs text-tenue">Panel del boliche</span>
      </span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <>
      <nav aria-label="Panel" className="mt-8 flex-1">
        {/* usePathname puede suspender en rutas con params dinámicos (cacheComponents). */}
        <Suspense fallback={<NavLinks pathname={null} onNavigate={onNavigate} />}>
          <ActiveNavLinks onNavigate={onNavigate} />
        </Suspense>
      </nav>

      <div className="flex flex-col gap-3 border-t border-linea pt-4 text-sm">
        <Link href={`/${ADMIN_VENUE_SLUG}`} className="text-tenue hover:text-luz" onClick={onNavigate}>
          Ver página pública
        </Link>
        <button
          type="button"
          className="text-left text-tenue hover:text-luz"
          onClick={() => setConfirmReset(true)}
        >
          Restablecer datos de prueba
        </button>
        <ConfirmDialog
          open={confirmReset}
          title="¿Volver a los datos de prueba?"
          body="Se pierden los eventos y cambios que cargaste en este navegador."
          confirmLabel="Restablecer"
          onConfirm={() => {
            resetEvents();
            onNavigate?.();
          }}
          onClose={() => setConfirmReset(false)}
        />
        <p className="text-xs leading-relaxed text-tenue/80">
          Modo demo: los cambios se guardan solo en este navegador.
        </p>
      </div>
    </>
  );
}

function ActiveNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const activeIndex = NAV.findIndex(({ href }) => isActive(href, pathname));

  return (
    <ul className="relative flex flex-col gap-1">
      {/*
        Un solo resaltado para todo el menú: al cambiar de sección se desliza
        hasta el nuevo elemento. Cada ítem mide h-11 (2.75rem) + gap-1 (0.25rem).
      */}
      {activeIndex >= 0 && (
        <li
          aria-hidden
          className="nav-resaltado pointer-events-none absolute inset-x-0 top-0 h-11 rounded-xl"
          style={{ transform: `translateY(${activeIndex * 3}rem)` }}
        />
      )}
      {NAV.map(({ href, label, icon: Icon }, i) => {
        const active = i === activeIndex;
        return (
          <li key={href} className="relative">
            <Link
              href={href}
              onClick={onNavigate}
              // Hacia una pestaña de más abajo el contenido sube; hacia una de más arriba, baja.
              transitionTypes={activeIndex < 0 || i === activeIndex ? undefined : [i > activeIndex ? "adm-sube" : "adm-baja"]}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-300 ${
                active ? "text-luz" : "text-tenue hover:bg-white/5 hover:text-luz"
              }`}
            >
              <Icon />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
