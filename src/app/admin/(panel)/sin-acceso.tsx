import type { StaffRole, StaffSession } from "@/lib/staff-session";
import { logoutStaff } from "./actions";

/** Cómo se muestra cada rol del personal. */
const ROL: Record<StaffRole, string> = {
  admin: "Administración",
  door: "Puerta",
  cashier: "Caja",
  rrpp: "RRPP",
};

/**
 * Sesión válida sin rol admin en ningún boliche: no hay panel que mostrarle.
 * Estética de la pantalla de ingreso (tarjeta centrada sobre la luz de marca).
 */
export function SinAcceso({ session }: { session: StaffSession }) {
  return (
    <main className="relative isolate flex min-h-svh flex-1 items-center justify-center px-4 py-10">
      {/* Luz de la marca detrás de la tarjeta. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(40% 35% at 30% 30%, #17b8f126, transparent 70%), radial-gradient(40% 35% at 70% 75%, #ee10b82e, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0e0c16e6] p-6 shadow-[0_40px_80px_-40px_#000] sm:p-8">
        <h1 className="text-2xl font-semibold">Sin acceso al panel</h1>
        <p className="mt-1 text-sm text-tenue">Tu usuario no administra ningún boliche.</p>
        {session.memberships.length > 0 && (
          <ul className="mt-6 flex flex-col gap-2">
            {session.memberships.map((m) => (
              <li
                key={`${m.venue.slug}:${m.role}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-2.5 text-sm"
              >
                <span>{m.venue.name}</span>
                <span className="text-xs text-tenue">{ROL[m.role]}</span>
              </li>
            ))}
          </ul>
        )}
        <form action={logoutStaff} className="mt-6">
          <button
            type="submit"
            className="min-h-12 w-full rounded-full bg-luz font-semibold text-noche transition-transform duration-150 active:scale-[0.98]"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
