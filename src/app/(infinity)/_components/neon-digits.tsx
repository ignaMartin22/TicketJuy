/*
 * Números de neón huecos, con la misma geometría que las letras del cartel:
 * trazos de 12.8 de grosor y 54.6 de alto, esquinas rectas. Cada dígito es solo
 * su contorno. Cuando cambia, el tubo se vuelve a dibujar y una chispa lo recorre.
 */

const W = 38;
const GAP = 7;
/** Margen alrededor para que el brillo no se corte. */
const PAD = 8;

const DIGITS: Record<string, string> = {
  "0": "M0 0H38V54.6H0z M12.8 12.8H25.2V41.8H12.8z",
  "1": "M4 0H25.2V54.6H12.4V12.8H4z",
  // El 2 y el 5 tienen una punta corta (como el medio del 3) para no confundirse con Z y S.
  "2": "M6 0H38V33.7H12.8V41.8H38V54.6H0V20.9H25.2V12.8H6z",
  "3": "M0 0H38V54.6H0V41.8H25.2V33.7H6V20.9H25.2V12.8H0z",
  "4": "M0 0H12.8V20.9H25.2V0H38V54.6H25.2V33.7H0z",
  "5": "M38 0H0V33.7H25.2V41.8H6V54.6H38V20.9H12.8V12.8H38z",
  "6": "M0 0H38V12.8H12.8V20.9H38V54.6H0z M12.8 33.7H25.2V41.8H12.8z",
  "7": "M0 0H38V54.6H25.2V12.8H0z",
  "8": "M0 0H38V54.6H0z M12.8 12.8H25.2V20.9H12.8z M12.8 33.7H25.2V41.8H12.8z",
  "9": "M38 54.6H0V41.8H25.2V33.7H0V0H38z M12.8 12.8H25.2V20.9H12.8z",
  "-": "M6 20.9H32V33.7H6z",
};

/**
 * `dibuja`: el tubo se vuelve a dibujar y lo recorre la chispa (para cambios que importan).
 * `titila`: sólo parpadea como un neón al prender, así el número siempre se lee (para los segundos).
 */
export function NeonDigits({ text, mode = "dibuja" }: { text: string; mode?: "dibuja" | "titila" }) {
  const width = text.length * W + (text.length - 1) * GAP;
  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${width + PAD * 2} ${54.6 + PAD * 2}`}
      className="inf-reloj-svg"
      data-modo={mode}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden
    >
      {[...text].map((d, j) => (
        // La clave cuenta desde la derecha: si cambia sólo la unidad, sólo se redibuja esa.
        <g key={`${text.length - j}-${d}`} transform={`translate(${j * (W + GAP)} 0)`}>
          <path d={DIGITS[d] ?? DIGITS["-"]} pathLength={100} className="inf-reloj-tubo" />
          <path d={DIGITS[d] ?? DIGITS["-"]} pathLength={100} className="inf-reloj-chispa" />
        </g>
      ))}
    </svg>
  );
}
