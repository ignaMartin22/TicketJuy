"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

const field =
  "mt-1.5 block min-h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-base text-luz outline-none transition-colors placeholder:text-white/30 focus:border-[color-mix(in_oklab,var(--magenta)_70%,transparent)] focus:bg-white/[0.06]";

/*
 * PROVISORIO: por ahora la pantalla no valida nada; al enviar entra directo al panel.
 * Cuando ticketera-core tenga usuarios del personal, el envío le pregunta a la API,
 * se guarda la sesión y /admin pasa a estar protegido.
 */
export function LoginForm() {
  const router = useRouter();
  const desde = useSearchParams().get("desde") ?? "";
  const [pending, setPending] = useState(false);

  const enter = (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    // Sólo se vuelve a una pantalla del panel (nunca a otro sitio).
    router.push(desde.startsWith("/admin") && !desde.startsWith("//") ? desde : "/admin");
  };

  return (
    <form onSubmit={enter} className="mt-6 flex flex-col gap-4">
      <label className="block text-sm font-medium text-white/80">
        Usuario
        <input name="usuario" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus className={field} />
      </label>
      <label className="block text-sm font-medium text-white/80">
        Contraseña
        <input name="clave" type="password" autoComplete="current-password" className={field} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 min-h-12 rounded-full bg-luz font-semibold text-noche transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
