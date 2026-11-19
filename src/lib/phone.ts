/**
 * Número argentino de celular: 10 dígitos (característica + número).
 * Tolera +54, el 9 y el 0 de adelante, y espacios o guiones.
 */
export function nationalPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9") && d.length === 11) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Formato para WhatsApp (E.164): +549 y los 10 dígitos. Null si el número no es válido. */
export function whatsappPhone(raw: string) {
  const d = nationalPhone(raw);
  return d.length === 10 ? `+549${d}` : null;
}
