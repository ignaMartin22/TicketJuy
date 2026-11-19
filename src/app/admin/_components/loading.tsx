/** Mientras se leen los datos guardados en el navegador. */
export function PanelLoading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse">
      <span className="sr-only">Cargando…</span>
      <div className="h-12 w-56 rounded-lg bg-noche-2" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-noche-2" />
        ))}
      </div>
      <div className="mt-6 h-72 rounded-2xl bg-noche-2" />
    </div>
  );
}
