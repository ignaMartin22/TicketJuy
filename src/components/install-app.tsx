"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";

/*
 * Botón para instalar la app. Aparece abajo, discreto, unos segundos después de
 * entrar a la portada, y no vuelve si ya está instalada o si lo cerraste.
 *
 * - Android y Chrome de escritorio: el navegador avisa que se puede instalar
 *   (beforeinstallprompt) y el botón abre directamente su cartel de instalar.
 * - iPhone y iPad (Safari): no dejan instalar desde la página; el botón muestra
 *   cómo hacerlo con "Compartir → Agregar a inicio".
 */

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const KEY = "inf-instalar-cerrado";

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  // Los iPad nuevos se presentan como Mac, pero tienen pantalla táctil.
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallApp() {
  const [mode, setMode] = useState<"android" | "ios" | null>(null);
  const [visible, setVisible] = useState(false);
  const [help, setHelp] = useState(false);
  const deferred = useRef<InstallEvent | null>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {}
    if (dismissed || isInstalled()) return;

    // Safari en iPhone no avisa nada: si es iOS y no está instalada, se ofrecen las instrucciones.
    const ios = isIOS();
    const show = window.setTimeout(() => {
      if (ios) setMode("ios");
      setVisible(true);
    }, 4000);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as InstallEvent;
      setMode("android");
    };
    const onInstalled = () => {
      setVisible(false);
      setMode(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(show);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const close = () => {
    setVisible(false);
    setHelp(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };

  const install = async () => {
    if (mode === "ios") return setHelp(true);
    const e = deferred.current;
    if (!e) return;
    await e.prompt();
    const { outcome } = await e.userChoice;
    deferred.current = null;
    if (outcome === "accepted") setVisible(false);
  };

  if (!mode || !visible) return null;

  return (
    <>
      <div className="inf-instalar fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-1 rounded-full border border-white/12 bg-[#0e0c16f2] p-1.5 pl-2 shadow-[0_18px_40px_-14px_#000,0_0_30px_-12px_#ee10b8]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="" className="size-9 rounded-xl" />
          <button type="button" onClick={install} className="flex min-h-11 flex-col justify-center px-2.5 text-left leading-tight">
            <span className="text-sm font-semibold text-luz">Instalá la app</span>
            <span className="text-xs text-white/55">Tus entradas a un toque</span>
          </button>
          <button
            type="button"
            onClick={install}
            className="min-h-10 rounded-full bg-luz px-4 text-sm font-semibold text-noche transition-transform duration-150 active:scale-[0.97]"
          >
            Instalar
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="No, gracias"
            className="grid size-10 place-items-center rounded-full text-white/50 hover:text-luz"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {help && (
        // iPhone: cómo instalarla a mano.
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          onClick={() => setHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="instalar-titulo"
        >
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0e0c16] p-6" onClick={(e) => e.stopPropagation()}>
            <h2 id="instalar-titulo" className="text-lg font-semibold">
              Instalá {SITE.shortName} en tu iPhone
            </h2>
            <ol className="mt-4 flex flex-col gap-4 text-white/80">
              <li className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/8 text-[#2f8cff]">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                  </svg>
                </span>
                <span>
                  Tocá <b className="text-luz">Compartir</b> abajo en Safari.
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/8 text-luz">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                    <rect x="4" y="4" width="16" height="16" rx="4" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </span>
                <span>
                  Elegí <b className="text-luz">Agregar a inicio</b> y después <b className="text-luz">Agregar</b>.
                </span>
              </li>
            </ol>
            <button type="button" onClick={() => setHelp(false)} className="mt-6 min-h-12 w-full rounded-full bg-luz font-semibold text-noche">
              Listo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
