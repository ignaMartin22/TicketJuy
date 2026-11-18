"use client";

import { useEffect, useRef } from "react";

/*
 * Estela del infinito: una luz recorre un ∞ (lemniscata de Bernoulli) y deja
 * una estela celeste en el lazo izquierdo y magenta en el derecho, como el logo.
 * WebGL puro, sin librerías. Se dibuja a resolución reducida, se pausa fuera de
 * pantalla y con "reducir movimiento" queda un cuadro fijo.
 */

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 res;
uniform float t;
const int N = 56;
const vec3 CIAN = vec3(0.090, 0.722, 0.945);
const vec3 MAGENTA = vec3(0.933, 0.063, 0.722);

float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

vec2 lem(float s) {
  float sn = sin(s);
  float d = 1.0 + sn * sn;
  return vec2(cos(s), sn * cos(s)) / d;
}

void main() {
  // El lienzo envuelve al logo: el ∞ ocupa casi todo el ancho.
  vec2 uv = (gl_FragCoord.xy - 0.5 * res) / res.x;
  uv /= 0.40;

  vec3 col = vec3(0.0);

  // Recorrido completo, apenas insinuado.
  float dmin = 10.0;
  for (int i = 0; i < 64; i++) {
    float s = float(i) / 64.0 * 6.2831853;
    dmin = min(dmin, length(uv - lem(s)));
  }
  vec3 tono = mix(CIAN, MAGENTA, smoothstep(-0.25, 0.25, uv.x));
  col += tono * 0.0016 / (dmin * dmin + 0.0016) * 0.18;

  // Dos cabezas de luz con estela, en lados opuestos del recorrido.
  for (int h = 0; h < 2; h++) {
    float cabeza = t * 0.55 + float(h) * 3.14159;
    vec2 prev = lem(cabeza);
    for (int i = 1; i <= N; i++) {
      float edad = float(i) / float(N);
      vec2 q = lem(cabeza - edad * 2.6);
      float d = seg(uv, prev, q);
      prev = q;
      float fuerza = pow(1.0 - edad, 2.2);
      vec3 c = mix(CIAN, MAGENTA, smoothstep(-0.2, 0.2, q.x));
      c = mix(c, vec3(1.0), (1.0 - smoothstep(0.0, 0.08, edad)) * 0.7);
      col += c * fuerza * 0.00011 / (d * d + 0.00012);
    }
  }

  // Viñeta y mapeo de tonos suave.
  float v = smoothstep(1.5, 0.6, length(uv * vec2(0.75, 1.3)));
  col *= v;
  col = 1.0 - exp(-col * 1.15);
  // Transparente donde no hay luz: se funde con el fondo de la página.
  gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));
}
`;

export function InfinityTrail({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: true, alpha: true });
    if (!gl) return; // Sin WebGL queda el degradado de fondo del contenedor.

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "res");
    const uT = gl.getUniformLocation(prog, "t");

    // Resolución reducida: es luz difusa, no hace falta nitidez. Tope para celulares modestos.
    const escala = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * escala));
      const h = Math.max(1, Math.round(canvas.clientHeight * escala));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    let raf = 0;
    const inicio = performance.now();
    const dibujar = (ahora: number) => {
      resize();
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, quieto ? 2.2 : (ahora - inicio) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!quieto && visible) raf = requestAnimationFrame(dibujar);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(dibujar);
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => quieto && requestAnimationFrame(dibujar));
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`block size-full ${className}`} />;
}
