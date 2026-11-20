/**
 * Fechas del formulario.
 *
 * El dueño piensa en "la noche del viernes" aunque la fiesta arranque el
 * sábado a las 00:30 (igual que `nightParts` en `@/lib/format`). El formulario
 * pide la noche y la hora; si la hora es de madrugada, el evento empieza en
 * realidad al día siguiente.
 *
 * Jujuy está en UTC-3 todo el año (sin horario de verano).
 */

const OFFSET = "-03:00";
const OFFSET_MS = 3 * 3600_000;
/** Antes de esta hora, el evento pertenece a la noche anterior. */
const NIGHT_CUTOFF_HOUR = 8;

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO -> { date: "2026-11-20", time: "00:30" } con la fecha de la noche. */
export function toNightInputs(iso: string) {
  // Corremos el instante a hora local de Jujuy y leemos los campos UTC.
  const local = new Date(new Date(iso).getTime() - OFFSET_MS);
  const hour = local.getUTCHours();
  const time = `${pad(hour)}:${pad(local.getUTCMinutes())}`;
  if (hour < NIGHT_CUTOFF_HOUR) local.setUTCDate(local.getUTCDate() - 1);
  const date = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
  return { date, time };
}

/** { date de la noche, time } -> ISO con zona de Argentina. */
export function fromNightInputs(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  if (hh < NIGHT_CUTOFF_HOUR) day.setUTCDate(day.getUTCDate() + 1);
  return `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}T${pad(hh)}:${pad(mm)}:00${OFFSET}`;
}

export function isPast(iso: string, now = Date.now()) {
  return new Date(iso).getTime() < now;
}

/** ISO -> valor de un <input type="datetime-local"> en hora de Jujuy ("2026-11-21T02:00"). Sin corrimiento de noche. */
export function toLocalInput(iso: string) {
  return new Date(new Date(iso).getTime() - OFFSET_MS).toISOString().slice(0, 16);
}

/** Valor de un <input type="datetime-local"> (hora de Jujuy) -> ISO con zona de Argentina. */
export function fromLocalInput(value: string) {
  return `${value.slice(0, 16)}:00${OFFSET}`;
}
