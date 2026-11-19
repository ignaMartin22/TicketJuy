"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const field =
  "min-h-12 w-full rounded-xl border border-linea bg-noche-2 px-4 text-base text-luz placeholder:text-tenue focus:border-accent focus:outline-none";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  const message = state.error ?? notice ?? null;
  return (
    <form action={action} className="panel mt-6 flex flex-col gap-4 rounded-3xl p-5">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Usuario
        <input name="username" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required className={field} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      {message && (
        <p role="alert" className="text-sm text-error">
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-full bg-luz px-6 text-base font-semibold text-noche transition-transform duration-200 active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
