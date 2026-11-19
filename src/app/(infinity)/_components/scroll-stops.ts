/*
 * Los puntos de referencia de la portada: la portada, el anillo de fechas armado,
 * las fotos e Instagram. El scroll es libre; estos puntos sólo marcan dónde empieza
 * y termina cada pase del hilo de neón (ver neon-thread.tsx).
 *
 * Los marcan los propios componentes:
 * - `.inf-snap`: un punto invisible; cuenta con él arriba de la pantalla.
 * - `[data-snap="centro"]`: cuenta con el elemento centrado.
 * - `[data-snap="fin"]`: el final de la página.
 */

/** Lo que tapa la barra flotante de arriba: "centro" centra en el espacio libre debajo de ella. */
function navHeight() {
  const nav = document.querySelector<HTMLElement>("header.fixed");
  return nav ? nav.getBoundingClientRect().bottom : 0;
}

/** La posición de scroll de un punto de descanso. */
export function stopOf(el: HTMLElement) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const r = el.getBoundingClientRect();
  const top = r.top + window.scrollY;
  const nav = navHeight();
  const y =
    el.dataset.snap === "centro"
      ? // Centrado debajo de la barra, y nunca tan arriba que la barra lo tape.
        Math.min(top + r.height / 2 - (window.innerHeight + nav) / 2, top - nav - 16)
      : el.dataset.snap === "fin"
        ? max
        : top;
  return Math.round(Math.min(Math.max(y, 0), max));
}

/** Todos los puntos de descanso de la página, de arriba a abajo. */
export function measureStops() {
  const ys = [...new Set([...document.querySelectorAll<HTMLElement>(".inf-snap, [data-snap]")].map(stopOf))].sort((a, b) => a - b);
  // Dos paradas casi en el mismo lugar (por ejemplo Instagram y el pie en la compu) cuentan como una: se queda la
  // de más arriba, así lo importante (Instagram) queda entero y no debajo de la barra.
  return ys.filter((y, i) => i === 0 || y - ys[i - 1] > window.innerHeight * 0.25);
}
