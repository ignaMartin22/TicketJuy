import { useId, type CSSProperties } from "react";

/*
 * El cartel de la portada: INFI∞ITY como el logo, hecho con tubos de neón.
 * Las letras son huecas (sólo su contorno) y la segunda N es un ∞ de un solo
 * tubo, que va de celeste a magenta. Como los carteles de verdad, esa letra
 * tiene dos juegos de tubos con temporizador: cada tanto se apaga el ∞ y se
 * prende la marca del logo (la N con los dos arcos), y vuelve. Los dos ocupan
 * el mismo lugar, así que el resto del cartel no se mueve.
 * Cada tubo tiene cuerpo: el vidrio del color y un núcleo casi blanco. Al
 * scrollear, los tubos se desenrollan (ver infinity.css) y siguen como las dos
 * líneas que envuelven la tarjeta.
 */

/** Contorno de cada letra con su ancho, tomados del logo y dibujados desde x = 0. */
const GLYPHS = {
  I: { w: 12.8, d: "M0 43h12.8v54.6h-12.8z" },
  N: { w: 53.5, d: "M0 43H14.37L40.7 79.74V43H53.5V97.6H39.13L12.8 60.86V97.6H0z" },
  F: { w: 35.5, d: "M0 43H35.5V55.8H12.8V64.9H30.4V77.7H12.8V97.6H0z" },
  T: { w: 40.9, d: "M0 43H40.9V55.8H26.85V97.6H14.05V55.8H0z" },
  Y: { w: 55.2, d: "M0 43H15.9L27.6 58.78L39.3 43H55.2L34 71.6V97.6H21.2V71.6z" },
};
type Letter = keyof typeof GLYPHS;

/**
 * La marca del logo (la N con el arco celeste y el magenta), en las mismas
 * coordenadas que el logo: de x = 209.26 a 339.74.
 */
const MARK = {
  left: 209.26,
  w: 130.48,
  shapes: [
    { d: "M242.25 41.5h12.4v45h-12.4z" },
    { d: "M294.35 54.7h12.4v45h-12.4z" },
    { d: "M263.3 43.85C263.3 61.5 285.7 79.69 285.7 97.35", stroke: 12.6 },
    { d: "M238.86 41.45A29.6 29.6 0 1 0 267.95 88L258.24 80.95A17.6 17.6 0 1 1 240.94 53.27z" },
    { d: "M310.14 99.75A29.6 29.6 0 1 0 281.05 53.2L290.76 60.25A17.6 17.6 0 1 1 308.06 87.93z" },
  ],
};

/** El ∞ ocupa lo mismo que la marca, con el mismo grosor que los trazos de las letras. */
const STROKE = 12.8;
const INF_W = MARK.w;
const INF_LINE_W = INF_W - STROKE;
const INF_LINE_H = 46;

const WORD = ["I", "N", "F", "I", "∞", "I", "T", "Y"] as const;
const GAP = 11;
/** Junto a la marca las letras van más pegadas, como en el logo. */
const GAP_MARK = 5;
/** La T y la Y encajan una en la otra, así que van más juntas. */
const GAP_TY = 4;
const width = (ch: (typeof WORD)[number]) => (ch === "∞" ? INF_W : GLYPHS[ch as Letter].w);

const PLACED = WORD.reduce<{ ch: (typeof WORD)[number]; x: number }[]>((placed, ch, i) => {
  const prev = placed[i - 1];
  const gap = i === 0 ? 0 : ch === "∞" || prev?.ch === "∞" ? GAP_MARK : WORD[i - 1] === "T" && ch === "Y" ? GAP_TY : GAP;
  return [...placed, { ch, x: prev ? prev.x + width(prev.ch) + gap : 0 }];
}, []);
const WIDTH = PLACED[PLACED.length - 1].x + width("Y");
/** Margen del dibujo a cada lado de las letras, en % del ancho del cartel (para alinear cosas a las letras). */
export const SIGN_INSET = +((8 / (WIDTH + 16)) * 100).toFixed(3);
const INF_X = PLACED[4].x;
/** Dónde va la marca del logo para quedar en el lugar del ∞. */
const MARK_DX = INF_X - MARK.left;
/** El recuadro donde viven el ∞ y la marca (con margen para el brillo). */
const SLOT = { x: INF_X - 12, y: 30, width: INF_W + 24, height: 81 };

/** La línea central del ∞ (lemniscata de Gerono), empezando en el cruce del medio. */
const INF_D = (() => {
  const cx = INF_X + INF_W / 2;
  const cy = 43 + 54.6 / 2;
  const pts: string[] = [];
  const n = 120;
  for (let k = 0; k <= n; k++) {
    const t = Math.PI / 2 + (k / n) * Math.PI * 2;
    const x = cx + (INF_LINE_W / 2) * Math.cos(t);
    const y = cy + INF_LINE_H * Math.sin(t) * Math.cos(t);
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
})();

/** Celeste en INFI, magenta en ITY, como el logo. */
const color = (i: number) => (i < 4 ? "var(--inf-cian)" : "var(--inf-magenta)");

export function NeonSign({ className = "" }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const grad = `${id}-grad`;
  const gradMark = `${id}-grad-marca`;
  const glow = `${id}-glow`;

  // El tubo del ∞ es hueco como las letras: una máscara deja ver sólo el borde de un trazo grueso.
  const hollowInf = (maskId: string, thick: number) => (
    <mask id={maskId} maskUnits="userSpaceOnUse" {...SLOT}>
      <path d={INF_D} pathLength={100} fill="none" stroke="#fff" strokeWidth={STROKE + thick} className="inf-infinito-trazo" />
      <path d={INF_D} fill="none" stroke="#000" strokeWidth={STROKE - thick} />
    </mask>
  );
  // La marca también es hueca: se engorda y se afina su silueta y queda sólo el borde,
  // así las piezas que se tocan (las barras con los arcos) forman un único contorno, sin líneas de más.
  const shapes = (paint: string) => (
    <g transform={`translate(${MARK_DX} 0)`}>
      {MARK.shapes.map((s) =>
        s.stroke ? (
          <path key={s.d} d={s.d} fill="none" stroke={paint} strokeWidth={s.stroke} strokeLinecap="butt" />
        ) : (
          <path key={s.d} d={s.d} fill={paint} />
        ),
      )}
    </g>
  );
  const hollowMark = (maskId: string, thick: number) => (
    <>
      <filter id={`${maskId}-in`} x="-10%" y="-20%" width="120%" height="140%">
        <feMorphology operator="dilate" radius={thick / 2} />
      </filter>
      <filter id={`${maskId}-out`} x="-10%" y="-20%" width="120%" height="140%">
        <feMorphology operator="erode" radius={thick / 2} />
      </filter>
      <mask id={maskId} maskUnits="userSpaceOnUse" {...SLOT}>
        <g filter={`url(#${maskId}-in)`}>{shapes("#fff")}</g>
        <g filter={`url(#${maskId}-out)`}>{shapes("#000")}</g>
      </mask>
    </>
  );

  return (
    <svg
      viewBox={`-8 30 ${WIDTH + 16} 81`}
      className={`inf-neon ${className}`}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      <defs>
        <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1={INF_X} x2={INF_X + INF_W} y1="0" y2="0">
          <stop offset="0" stopColor="#17b8f1" />
          <stop offset="1" stopColor="#ee10b8" />
        </linearGradient>
        {/* La marca como en el logo: arco celeste, N blanca, arco magenta. */}
        <linearGradient id={gradMark} gradientUnits="userSpaceOnUse" x1={INF_X} x2={INF_X + INF_W} y1="0" y2="0">
          <stop offset="0.3" stopColor="#17b8f1" />
          <stop offset="0.42" stopColor="#dcd6ff" />
          <stop offset="0.58" stopColor="#dcd6ff" />
          <stop offset="0.7" stopColor="#ee10b8" />
        </linearGradient>
        {/* Un solo brillo para todo el cartel: un halo corto y uno ancho, del color de cada tubo. */}
        <filter id={glow} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="cerca" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="lejos" />
          <feMerge>
            <feMergeNode in="lejos" />
            <feMergeNode in="lejos" />
            <feMergeNode in="cerca" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {hollowInf(`${id}-inf-body`, 4.4)}
        {hollowInf(`${id}-inf-core`, 1.6)}
        {hollowMark(`${id}-mark-body`, 4.4)}
        {hollowMark(`${id}-mark-core`, 1.6)}
      </defs>

      {/* La luz que el cartel derrama sobre la pared: los mismos tubos, gruesos y desenfocados, detrás. */}
      <g className="inf-derrame">
        {PLACED.map(({ ch, x }, i) =>
          ch === "∞" ? (
            <path key={i} d={INF_D} stroke={`url(#${grad})`} strokeWidth={STROKE + 8} />
          ) : (
            <path key={i} d={GLYPHS[ch].d} transform={`translate(${x} 0)`} stroke={color(i)} />
          ),
        )}
      </g>

      <g filter={`url(#${glow})`}>
        {/* El ∞, que es lo que se ve casi siempre. */}
        <g className="inf-infinito inf-alterna-inf" style={{ "--i": 4 } as CSSProperties}>
          <rect {...SLOT} fill={`url(#${grad})`} mask={`url(#${id}-inf-body)`} opacity="0.75" />
          <rect {...SLOT} fill="#fff" mask={`url(#${id}-inf-core)`} opacity="0.9" />
        </g>
        {/* La marca del logo, que se prende cada tanto en lugar del ∞. Se apaga cuando el cartel se desarma. */}
        <g className="inf-marca-escena">
          <g className="inf-alterna-marca">
            <rect {...SLOT} fill={`url(#${gradMark})`} mask={`url(#${id}-mark-body)`} opacity="0.8" />
            <rect {...SLOT} fill="#fff" mask={`url(#${id}-mark-core)`} opacity="0.9" />
          </g>
        </g>
        {PLACED.filter(({ ch }) => ch !== "∞").map(({ ch, x }) => {
          const i = PLACED.findIndex((p) => p.x === x);
          const d = GLYPHS[ch as Letter].d;
          return (
            <g
              key={i}
              transform={`translate(${x} 0)`}
              className={i === 2 ? "inf-tubo-flojo" : ""}
              style={{ "--i": i, color: color(i) } as CSSProperties}
            >
              <path d={d} pathLength={100} className="inf-tubo-vidrio" />
              <path d={d} pathLength={100} className="inf-tubo" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
