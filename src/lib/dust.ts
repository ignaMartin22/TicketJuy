// Polvo de entrada: al sumar una entrada, la fila suelta un polvo brillante que viaja
// en curva hasta el total y ahí se apaga. Un solo canvas fijo para toda la página,
// que se crea en el primer uso y deja de dibujar apenas no queda polvo en el aire.
// Por cuadro solo se lee dónde está el destino (la barra de abajo puede venir
// entrando mientras tanto); el resto es dibujo en el canvas, sin tocar la página.

type Particle = {
  x: number;
  y: number;
  /** Deriva mientras se deshace, en px por ms. */
  vx: number;
  vy: number;
  size: number;
  color: string;
  /** Cuándo empieza a deshacerse y cuándo sale volando (ms desde el inicio). */
  loosen: number;
  leave: number;
  travel: number;
  /** Dónde cae dentro del destino y para qué lado se abre la curva. */
  dx: number;
  dy: number;
  bend: number;
  /** Desde dónde salió volando (se fija al salir). */
  sx: number;
  sy: number;
  twinkle: number;
};

type Burst = {
  start: number;
  particles: Particle[];
  target: () => DOMRect | null;
  onArrive: () => void;
  arrived: boolean;
  /** Cuando llega esta parte del polvo, el total cambia. */
  arriveAt: number;
};

const DISSOLVE_MS = 260;

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
const bursts: Burst[] = [];

function ensureCanvas() {
  if (canvas && canvas.isConnected) return;
  canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "60",
  });
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);
}

function resize() {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Punto de una curva cúbica. */
function bezier(a: number, b: number, c: number, d: number, t: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

function frame(now: number) {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.globalCompositeOperation = "lighter";

  for (let b = bursts.length - 1; b >= 0; b--) {
    const burst = bursts[b];
    const t = now - burst.start;
    const rect = burst.target();
    let alive = 0;
    let landed = 0;

    for (const p of burst.particles) {
      let x = p.x;
      let y = p.y;
      let alpha = 1;

      if (t < p.loosen) {
        // Todavía es parte de la fila: no se ve (la fila brilla por su cuenta).
        alive++;
        continue;
      } else if (t < p.leave) {
        // Se deshace: tiembla y se corre un poco.
        const k = t - p.loosen;
        x = p.x + p.vx * k;
        y = p.y + p.vy * k;
        alpha = Math.min(1, k / 80);
        p.sx = x;
        p.sy = y;
      } else {
        const k = (t - p.leave) / p.travel;
        if (k >= 1 || !rect) {
          landed++;
          continue;
        }
        const e = easeInOut(k);
        const tx = rect.left + rect.width * p.dx;
        const ty = rect.top + rect.height * p.dy;
        // La curva se abre hacia un costado y cae sobre el total, como un chorro.
        const c1x = p.sx + p.bend * 140;
        const c1y = p.sy - 30;
        const c2x = tx + p.bend * 90;
        const c2y = ty - 140;
        x = bezier(p.sx, c1x, c2x, tx, e);
        y = bezier(p.sy, c1y, c2y, ty, e);
        // Se achica al llegar.
        alpha = k > 0.85 ? (1 - k) / 0.15 : 1;
      }

      alive++;
      const flicker = 0.65 + 0.35 * Math.sin(now / 45 + p.twinkle);
      const a = Math.max(0, alpha * flicker);
      ctx.fillStyle = p.color;
      // Un halo tenue y el grano encima: en una pantalla oscura brilla como neón.
      const halo = p.size * 3;
      ctx.globalAlpha = a * 0.18;
      ctx.fillRect(x - halo / 2, y - halo / 2, halo, halo);
      ctx.globalAlpha = a;
      ctx.fillRect(x - p.size / 2, y - p.size / 2, p.size, p.size);
    }

    if (!burst.arrived && landed >= burst.arriveAt) {
      burst.arrived = true;
      burst.onArrive();
    }
    if (alive === 0) {
      if (!burst.arrived) burst.onArrive();
      bursts.splice(b, 1);
    }
  }

  ctx.globalAlpha = 1;
  if (bursts.length) {
    raf = requestAnimationFrame(frame);
  } else {
    raf = 0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Deshace `from` en polvo y lo manda volando hasta lo que devuelva `target`
 * (se consulta en cada cuadro, por si se mueve). `onArrive` corre cuando llega
 * buena parte del polvo: ahí se actualiza el total. Sin animaciones, corre ya.
 */
export function sendDust({
  from,
  origin,
  target,
  colors,
  onArrive,
}: {
  from: DOMRect;
  /** Punto desde donde arranca a deshacerse (el botón que se tocó). */
  origin: { x: number; y: number };
  target: () => DOMRect | null;
  colors: string[];
  onArrive: () => void;
}) {
  if (prefersReducedMotion()) {
    onArrive();
    return;
  }
  ensureCanvas();

  const count = Math.round(Math.min(320, Math.max(140, (from.width * from.height) / 70)));
  const reach = Math.max(from.width, from.height);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const x = from.left + Math.random() * from.width;
    const y = from.top + Math.random() * from.height;
    // Se deshace como una onda que sale del botón.
    const dist = Math.hypot(x - origin.x, y - origin.y) / reach;
    const loosen = dist * 220 + Math.random() * 50;
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.7) * 0.05,
      size: 1.4 + Math.random() * 2,
      color: colors[(Math.random() * colors.length) | 0],
      loosen,
      // Los primeros en soltarse son los primeros en irse: sale como un chorro.
      leave: loosen + DISSOLVE_MS * (0.4 + Math.random() * 0.6),
      travel: 620 + Math.random() * 260,
      dx: 0.15 + Math.random() * 0.7,
      dy: 0.3 + Math.random() * 0.4,
      bend: 0.6 + Math.random() * 0.8,
      sx: x,
      sy: y,
      twinkle: Math.random() * Math.PI * 2,
    });
  }

  bursts.push({
    start: performance.now(),
    particles,
    target,
    onArrive,
    arrived: false,
    arriveAt: Math.round(count * 0.35),
  });
  if (!raf) raf = requestAnimationFrame(frame);
}
