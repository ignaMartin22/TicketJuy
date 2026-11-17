import Image from "next/image";
import { useId, ViewTransition } from "react";
import type { Event } from "@/lib/mock-data";

/**
 * Flyer provisorio: foto del boliche (si hay) teñida con su neón, y el título
 * como afiche. Se reemplaza por el flyer real de cada fecha cuando vivan en
 * Supabase Storage.
 */
export function Flyer({
  event,
  backdrop,
  size = "lg",
  className = "",
  priority = false,
}: {
  event: Event;
  /** Foto de fondo, normalmente la del boliche. */
  backdrop?: string;
  size?: "sm" | "lg";
  className?: string;
  priority?: boolean;
}) {
  const grano = useId();
  // Mismo nombre en la lista y en el evento: el flyer "viaja" al navegar.
  return (
    <ViewTransition name={`flyer-${event.venueSlug}-${event.slug}`} share="flyer-vuela" default="none">
    <div
      className={`relative isolate flex flex-col justify-end overflow-hidden bg-noche-2 ${className}`}
      role="img"
      aria-label={`Flyer de ${event.title}`}
    >
      {backdrop && (
        <Image
          src={backdrop}
          alt=""
          fill
          priority={priority}
          sizes={size === "lg" ? "(min-width: 1024px) 480px, 100vw" : "96px"}
          className="-z-20 object-cover opacity-60 saturate-[0.8]"
        />
      )}
      {/* Luz de neón desde arriba */}
      <div
        className="absolute -top-1/4 left-1/2 -z-10 aspect-square w-[130%] -translate-x-1/2 mix-blend-screen"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--accent) 45%, transparent), color-mix(in oklab, var(--accent) 10%, transparent) 60%, transparent)",
        }}
        aria-hidden
      />
      {/* Grano */}
      <svg className="absolute inset-0 -z-10 size-full opacity-[0.12] mix-blend-overlay" aria-hidden>
        <filter id={grano}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grano})`} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 -z-10 h-3/4 bg-gradient-to-t from-noche via-noche/70 to-transparent" aria-hidden />
      <div className={size === "lg" ? "p-4 sm:p-6" : "p-4"}>
        <p
          className={`display uppercase text-white text-balance ${
            size === "lg" ? "text-5xl sm:text-7xl" : "text-4xl"
          }`}
        >
          {event.title}
        </p>
        <p
          className={`mt-3 font-medium text-accent ${
            size === "lg" ? "text-base" : "text-sm"
          }`}
        >
          {event.lineup.join(", ")}
        </p>
      </div>
    </div>
    </ViewTransition>
  );
}
