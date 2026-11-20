"use client";

import { useCallback, useState } from "react";
import { SaveError } from "./store";

/**
 * Acciones rápidas del panel (pausar, publicar, eliminar): espera a la API,
 * marca la acción en curso y guarda el mensaje de error para mostrarlo.
 */
export function usePanelAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const run = useCallback(async (action: () => Promise<void>) => {
    setError(null);
    setPending(true);
    try {
      await action();
    } catch (err) {
      setError(err instanceof SaveError ? err.message : "No pudimos guardar el cambio. Probá de nuevo.");
    } finally {
      setPending(false);
    }
  }, []);
  return { run, error, pending };
}
