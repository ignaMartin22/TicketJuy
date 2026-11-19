/** Hora de Jujuy, "01:42". Sirve en servidor y cliente. */
const fmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Jujuy",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatTime(iso: string) {
  return fmt.format(new Date(iso));
}
