import { headers } from "next/headers";

// Headers opcionales que el front le manda a ticketera-core. Solo desde el servidor de Next.
// Si TICKETERA_FRONT_KEY no está definida no se manda nada y todo funciona como antes.

/** X-Front-Key: secreto compartido con el back. Es constante, así que sirve también dentro de "use cache". */
export function frontKeyHeaders(): Record<string, string> {
  const key = process.env.TICKETERA_FRONT_KEY;
  return key ? { "X-Front-Key": key } : {};
}

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;
const IPV6 = /^[0-9a-f:.]+$/i;

function isIp(value: string) {
  if (IPV4.test(value)) return true;
  return value.includes(":") && value.length <= 45 && IPV6.test(value) && value.split(":").length >= 3;
}

/**
 * IP real del visitante, solo de los headers de la request entrante (nunca del body).
 * Criterio: `x-real-ip` si está (lo setea el proxy de borde, no el cliente). Si no, el ÚLTIMO valor
 * no vacío de `x-forwarded-for`: el proxy de Railway agrega ahí la IP con la que le llegó la conexión,
 * mientras que los valores de la izquierda los puede inventar el cliente. Si no tiene forma de IP, undefined.
 * Hay que leer `headers()`: no usar dentro de "use cache".
 */
export async function visitorIp(): Promise<string | undefined> {
  const h = await headers();
  const real = h.get("x-real-ip")?.trim();
  if (real && isIp(real)) return real;
  const last = h
    .get("x-forwarded-for")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .pop();
  return last && isIp(last) ? last : undefined;
}

/** X-Front-Key + X-Buyer-Ip (la IP solo viaja si hay clave: el back no confía en ella sin la clave). */
export async function buyerHeaders(): Promise<Record<string, string>> {
  const key = frontKeyHeaders();
  if (!key["X-Front-Key"]) return {};
  const ip = await visitorIp();
  return ip ? { ...key, "X-Buyer-Ip": ip } : key;
}
