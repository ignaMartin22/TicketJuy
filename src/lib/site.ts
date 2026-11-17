/**
 * Datos de contacto de TicketJuy.
 * PENDIENTE: cargar el número real (formato internacional sin "+", ej. 5493881234567).
 * Mientras esté vacío, la landing muestra el botón de contacto deshabilitado.
 */
export const CONTACT_WHATSAPP = "";

export function whatsappLink(text: string) {
  if (!CONTACT_WHATSAPP) return null;
  return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
