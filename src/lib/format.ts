const TZ = "America/Argentina/Jujuy";

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return ars.format(amount);
}

function part(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-AR", { timeZone: TZ, ...opts })
    .format(new Date(iso))
    .replace(/\./g, "");
}

/**
 * Los eventos que arrancan de madrugada se muestran por la noche anterior
 * ("la noche del viernes"), que es como lo piensa la gente.
 */
function nightIso(iso: string) {
  const hour = Number(part(iso, { hour: "2-digit", hour12: false }));
  return hour < 8
    ? new Date(new Date(iso).getTime() - 8 * 3600_000).toISOString()
    : iso;
}

/** Partes de la fecha para los bloques de fecha. */
export function nightParts(iso: string) {
  const night = nightIso(iso);
  return {
    day: part(night, { day: "numeric" }),
    month: part(night, { month: "short" }),
    monthLong: part(night, { month: "long" }),
    weekday: part(night, { weekday: "long" }),
    time: part(iso, { hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

/** "viernes 20 de noviembre, desde las 00:30" */
export function formatNight(iso: string) {
  const p = nightParts(iso);
  return `${p.weekday} ${p.day} de ${p.monthLong}, desde las ${p.time}`;
}

/** Cargo de servicio redondeado a pesos enteros. */
export function serviceFee(price: number, rate: number) {
  return Math.round(price * rate);
}
