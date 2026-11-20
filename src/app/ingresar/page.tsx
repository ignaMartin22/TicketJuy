import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false, follow: false } };

export default function LoginPage() {
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
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/infinity/infinity-logo.svg" alt="Infinity" className="mx-auto h-7 w-auto" />
        <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-[#0e0c16e6] p-6 shadow-[0_40px_80px_-40px_#000] sm:p-8">
          <h1 className="text-2xl font-semibold">Ingreso del personal</h1>
          <p className="mt-1 text-sm text-tenue">Administración entra al panel; puerta, al escáner.</p>
          {/* useSearchParams (adónde volver) puede suspender. */}
          <Suspense fallback={<div className="mt-6 h-64" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-tenue hover:text-luz">
            ← Volver a la página
          </Link>
        </p>
      </div>
    </main>
  );
}
