"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { loginStaff } from "./actions";

const field =
  "mt-1.5 block min-h-12 w-full rounded-xl border border-white/12 bg-white/[0.04] px-4 text-base text-luz outline-none transition-colors placeholder:text-white/30 focus:border-[color-mix(in_oklab,var(--magenta)_70%,transparent)] focus:bg-white/[0.06]";

/*
 * El login le pega a ticketera-core y la sesión queda en una cookie httpOnly
 * que solo lee el servidor de Next. Sin API configurada el panel entra en modo demo.
 */
export function LoginForm() {
  const desde = useSearchParams().get("desde") ?? "";
  const [state, formAction, isPending] = useActionState(loginStaff, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="desde" value={desde} />
      <label className="block text-sm font-medium text-white/80">
        Usuario
        <input name="usuario" autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus className={field} />
      </label>
      <label className="block text-sm font-medium text-white/80">
        Contraseña
        <input name="clave" type="password" autoComplete="current-password" className={field} />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-error">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="mt-2 min-h-12 rounded-full bg-luz font-semibold text-noche transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
      >
        {isPending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
