"use client";

import { useParams } from "next/navigation";
import { useAdminEvents, useHydrated } from "./store";

/** Evento de la ruta /admin/eventos/[slug]. Necesita un <Suspense> arriba (cacheComponents). */
export function useEventFromUrl() {
  const { slug } = useParams<{ slug: string }>();
  const events = useAdminEvents();
  const hydrated = useHydrated();
  return { slug, hydrated, event: events.find((e) => e.slug === slug) };
}
