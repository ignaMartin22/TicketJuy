"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { StaffMembership, StaffRole, StaffSession } from "@/lib/staff-session";
import { logoutStaff } from "../(panel)/actions";
import { resetEvents, startPanel, useLoadError } from "../_lib/store";
import { ConfirmDialog } from "./confirm-dialog";
import { PageTransition } from "./page-transition";
import { CalendarIcon, ChartIcon, CloseIcon, MenuIcon, PlusIcon } from "./icons";

/** Cómo se muestra cada rol del personal. */
const ROL: Record<StaffRole, string> = {
  admin: "Administración",
  door: "Puerta",
  cashier: "Caja",
  rrpp: "RRPP",
};

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
export function AdminShell({
  children,
  session,
  membership,
  demo,
}: {
  children: ReactNode;
  session: StaffSession;
  membership: StaffMembership;
  demo?: boolean;
}) {
  const drawer = useRef<HTMLDialogElement>(null);
  const close = () => drawer.current?.close();
  // Con API, las fechas salen del boliche de la membresía; sin API, de los datos de prueba.
  const venueSlug = membership.venue.slug;
  useEffect(() => startPanel(!demo, venueSlug), [demo, venueSlug]);

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Celular y tablet */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-linea bg-noche/90 px-4 backdrop-blur lg:hidden">
        <Brand name={membership.venue.name} />
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
            <Brand name={membership.venue.name} onNavigate={close} />
            <button
              type="button"
              onClick={close}
              className="-mr-2 flex size-11 items-center justify-center rounded-lg text-tenue hover:text-luz"
              aria-label="Cerrar menú"
            >
              <CloseIcon />
            </button>
          </div>
          <SidebarBody session={session} membership={membership} demo={demo} onNavigate={close} />
        </div>
      </dialog>

      {/* PC */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-linea bg-noche-2/60 p-5 lg:flex">
        <Brand name={membership.venue.name} />
        <SidebarBody session={session} membership={membership} demo={demo} />
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <LoadError />
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}

function Brand({ name, onNavigate }: { name: string; onNavigate?: () => void }) {
  return (
    <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5">
      <span className="neon-soft size-2 rounded-full bg-accent" aria-hidden />
      <span className="leading-tight">
        <span className="block text-sm font-semibold">{name}</span>
        <span className="block text-xs text-tenue">Panel del boliche</span>
      </span>
    </Link>
  );
}

function SidebarBody({
  session,
  membership,
  demo,
  onNavigate,
}: {
  session: StaffSession;
  membership: StaffMembership;
  demo?: boolean;
  onNavigate?: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <nav aria-label="Panel" className="mt-8 flex-1">
        {/* usePathname puede suspender en rutas con params dinámicos (cacheComponents). */}
        <Suspense fallback={<NavLinks pathname={null} onNavigate={onNavigate} />}>
          <ActiveNavLinks onNavigate={onNavigate} />
        </Suspense>
      </nav>

      <div className="flex flex-col gap-3 border-t border-linea pt-4 text-sm">
        <div>
          <p className="font-medium">{session.username}</p>
          <p className="text-xs text-tenue">{ROL[membership.role]}</p>
          {demo && <p className="mt-1 text-xs text-tenue">Sesión de demostración</p>}
        </div>
        <Link
          href={`/${membership.venue.slug}`}
          className="text-tenue hover:text-luz"
          onClick={onNavigate}
        >
          Ver página pública
        </Link>
        {/* Administración también puede escanear: misma sesión, sin volver a entrar. */}
        <Link href="/puerta" className="text-tenue hover:text-luz" onClick={onNavigate}>
          Portería (escanear entradas)
        </Link>
        {session.memberships.some((m) => m.role === "rrpp") && (
          <Link href="/rrpp" className="text-tenue hover:text-luz" onClick={onNavigate}>
            Mis listas
          </Link>
        )}
        {demo && (
          <button
            type="button"
            className="text-left text-tenue hover:text-luz"
            onClick={() => setConfirmReset(true)}
          >
            Restablecer datos de prueba
          </button>
        )}
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
        <button
          type="button"
          className="text-left text-tenue hover:text-luz disabled:opacity-60"
          disabled={pending}
          onClick={() => {
            onNavigate?.();
            startTransition(() => logoutStaff());
          }}
        >
          {pending ? "Saliendo…" : "Cerrar sesión"}
        </button>
        {demo && (
          <p className="text-xs leading-relaxed text-tenue/80">
            Modo demo: los cambios se guardan solo en este navegador.
          </p>
        )}
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

/** Si la API no respondió al cargar las fechas. */
function LoadError() {
  const error = useLoadError();
  if (!error) return null;
  return (
    <p role="alert" className="mb-6 rounded-2xl border border-error/40 bg-error/10 p-4 text-sm text-error">
      {error}
    </p>
  );
}
