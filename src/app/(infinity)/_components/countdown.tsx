"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { NeonDigits } from "./neon-digits";

/**
 * Cuenta regresiva hasta que abre la próxima fecha, como un tablero de neón:
 * cada unidad tiene su tono del recorrido celeste → magenta, los dígitos son
 * tubos huecos como el cartel que se vuelven a encender al cambiar, y una barra
 * fina muestra cuánto queda de esa unidad.
 */
/** Milisegundos que faltan, actualizados cada segundo. null hasta que carga en el navegador. */
function useTimeLeft(iso: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(new Date(iso).getTime() - Date.now(), 0));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [iso]);
  return left;
}

/**
 * La versión compacta: una pastilla de una línea ("Abre en 02d 04h 25m 21s")
 * que va montada sobre el borde de la tarjeta de la portada, como un sello.
 */
export function CountdownPill({ iso }: { iso: string }) {
  const left = useTimeLeft(iso);

  if (left === 0) {
    return (
      <p className="inf-pastilla">
        <span className="inf-punto-vivo size-2 rounded-full bg-[#9dff7a]" aria-hidden />
        <span className="inf-pastilla-texto">Es esta noche</span>
      </p>
    );
  }

  const s = Math.floor((left ?? 0) / 1000);
  const parts: [string, number][] = [
    ["d", Math.floor(s / 86400)],
    ["h", Math.floor(s / 3600) % 24],
    ["m", Math.floor(s / 60) % 60],
    ["s", s % 60],
  ];
  const texto = parts.map(([u, v]) => `${v} ${u}`).join(" ");

  return (
    <p className="inf-pastilla" aria-label={left === null ? undefined : `Abre en ${texto}`}>
      <span className="inf-punto-vivo size-2 rounded-full bg-[#9dff7a]" aria-hidden />
      <span className="inf-pastilla-texto">Abre en</span>
      <span className="inf-pastilla-reloj" aria-hidden>
        {parts.map(([unit, value], i) => {
          const t = left === null ? "--" : String(value).padStart(2, "0");
          return (
            <span key={unit} className="inf-pastilla-unidad" style={{ "--c": `color-mix(in oklch, var(--inf-cian), var(--inf-magenta) ${(i / 3) * 100}%)` } as CSSProperties}>
              <NeonDigits text={t} mode={unit === "s" ? "titila" : "dibuja"} />
              <span className="inf-pastilla-u">{unit}</span>
            </span>
          );
        })}
      </span>
    </p>
  );
}

export function Countdown({ iso }: { iso: string }) {
  const left = useTimeLeft(iso);

  if (left === 0) {
    return (
      <p className="inf-reloj inf-titulo inf-reloj-ya">
        <span className="inf-punto-vivo inline-block size-2.5 rounded-full bg-[#9dff7a]" aria-hidden />
        Es esta noche
      </p>
    );
  }

  const s = Math.floor((left ?? 0) / 1000);
  const days = Math.floor(s / 86400);
  // [etiqueta, valor, cuánto llena la barra (0–1), clave que cambia cuando la barra vuelve a llenarse]
  const parts: [string, number, number, number][] = [
    ["días", days, Math.min(days, 30) / 30, 0],
    ["horas", Math.floor(s / 3600) % 24, (Math.floor(s / 3600) % 24) / 24, days],
    ["min", Math.floor(s / 60) % 60, (Math.floor(s / 60) % 60) / 60, Math.floor(s / 3600)],
    ["seg", s % 60, (s % 60) / 60, Math.floor(s / 60)],
  ];

  return (
    <dl className="inf-reloj" aria-live="off">
      {parts.map(([label, value, fill, lap], i) => {
        const text = left === null ? "--" : String(value).padStart(2, "0");
        return (
          <Fragment key={label}>
            {i > 0 && (
              <span className="inf-reloj-sep" aria-hidden>
                <i />
                <i />
              </span>
            )}
            <div className="inf-reloj-celda" style={{ "--i": i } as CSSProperties}>
              <dd className="inf-reloj-num">
                {/* Un destello cada vez que cambia el número. */}
                <span key={`f${text}`} className="inf-reloj-flash" aria-hidden />
                <NeonDigits text={text} mode={label === "seg" ? "titila" : "dibuja"} />
                <span className="sr-only">{text}</span>
              </dd>
              <dt className="inf-reloj-label">{label}</dt>
              {/* Los días no tienen un tope natural: sin barra, pero con su lugar para que todo quede alineado. */}
              <span className={`inf-reloj-barra ${label === "días" ? "invisible" : ""}`} aria-hidden>
                {/* Al dar la vuelta se vuelve a montar, así no se ve la barra retroceder. */}
                <span key={lap} style={{ "--p": left === null ? 0 : fill } as CSSProperties} />
              </span>
            </div>
          </Fragment>
        );
      })}
    </dl>
  );
}
