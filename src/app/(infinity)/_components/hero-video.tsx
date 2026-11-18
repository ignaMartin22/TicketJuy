"use client";

import { useEffect, useRef } from "react";

/** Video de fondo del marco de la portada. Con "reducir movimiento" queda quieto en el primer cuadro. */
export function HeroVideo({ src, poster }: { src: string; poster: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) ref.current?.pause();
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      className="absolute inset-0 size-full object-cover"
    />
  );
}
