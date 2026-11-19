import { fromNightInputs, isPast, toNightInputs } from "./dates";
import type { EventInput } from "./store";
import type { AdminEvent, AdminTicketType, TicketKind } from "./types";

/*
 * Lo que edita el formulario. Los números van como texto mientras se escriben
 * (un input vacío no es 0) y se validan recién al guardar.
 */

export type DraftTicket = {
  id: string;
  kind: TicketKind;
  name: string;
  description: string;
  price: string;
  capacity: string;
  /** Vendidas hasta ahora: no se edita, pero limita el cupo. */
  sold: number;
};

export type Draft = {
  title: string;
  lineup: string;
  description: string;
  date: string;
  time: string;
  doorsNote: string;
  ageLimit: string;
  dressCode: string;
  cover?: string;
  salesOpen: boolean;
  tickets: DraftTicket[];
};

export type Errors = Partial<Record<string, string>>;

export const DEFAULT_DESCRIPTION: Record<TicketKind, string> = {
  general: "Ingreso general.",
  vip: "Fila VIP en la puerta y acceso al sector VIP.",
};

export function newTicket(kind: TicketKind, taken: string[]): DraftTicket {
  let n = 1;
  while (taken.includes(`${kind}-${n}`)) n++;
  return {
    id: `${kind}-${n}`,
    kind,
    name: kind === "vip" ? "VIP" : "General",
    description: DEFAULT_DESCRIPTION[kind],
    price: "",
    capacity: "",
    sold: 0,
  };
}

export function emptyDraft(): Draft {
  const general = newTicket("general", []);
  return {
    title: "",
    lineup: "",
    description: "",
    date: "",
    time: "00:30",
    doorsNote: "",
    ageLimit: "18",
    dressCode: "",
    salesOpen: true,
    tickets: [general, newTicket("vip", [general.id])],
  };
}

export function draftFromEvent(e: AdminEvent): Draft {
  return {
    title: e.title,
    lineup: e.lineup.join(", "),
    description: e.description,
    ...toNightInputs(e.startsAt),
    doorsNote: e.doorsNote,
    ageLimit: String(e.ageLimit),
    dressCode: e.dressCode ?? "",
    cover: e.cover,
    salesOpen: e.salesOpen,
    tickets: e.ticketTypes.map((t) => ({
      id: t.id,
      kind: t.kind,
      name: t.name,
      description: t.description,
      price: String(t.price),
      capacity: String(t.capacity),
      sold: t.sold,
    })),
  };
}

const toInt = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s.trim()) : NaN);

/** Errores por campo. Las claves de entradas son `ticket.<id>.<campo>`. */
export function validate(d: Draft, { isNew }: { isNew: boolean }): Errors {
  const errors: Errors = {};
  if (!d.title.trim()) errors.title = "Poné el nombre del evento.";
  if (!d.date) errors.date = "Elegí la fecha.";
  if (!d.time) errors.time = "Elegí la hora de inicio.";
  if (d.date && d.time && isNew && isPast(fromNightInputs(d.date, d.time))) {
    errors.date = "La fecha ya pasó.";
  }
  const age = toInt(d.ageLimit);
  if (!Number.isInteger(age) || age < 0 || age > 99) errors.ageLimit = "Edad entre 0 y 99.";

  if (d.tickets.length === 0) errors.tickets = "Agregá al menos un tipo de entrada.";
  for (const t of d.tickets) {
    const key = `ticket.${t.id}`;
    if (!t.name.trim()) errors[`${key}.name`] = "Poné un nombre.";
    const price = toInt(t.price);
    if (!Number.isInteger(price) || price <= 0) errors[`${key}.price`] = "Precio en pesos, sin centavos.";
    const capacity = toInt(t.capacity);
    if (!Number.isInteger(capacity) || capacity <= 0) {
      errors[`${key}.capacity`] = "Cantidad mayor a 0.";
    } else if (capacity < t.sold) {
      errors[`${key}.capacity`] = `Ya se vendieron ${t.sold}: no puede ser menos.`;
    }
  }
  return errors;
}

/** Solo llamar con un borrador sin errores. */
export function draftToInput(d: Draft): EventInput {
  return {
    title: d.title.trim(),
    lineup: d.lineup
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    description: d.description.trim(),
    startsAt: fromNightInputs(d.date, d.time),
    doorsNote: d.doorsNote.trim(),
    ageLimit: toInt(d.ageLimit),
    dressCode: d.dressCode.trim() || undefined,
    cover: d.cover,
    salesOpen: d.salesOpen,
    ticketTypes: d.tickets.map(
      (t): AdminTicketType => ({
        id: t.id,
        kind: t.kind,
        name: t.name.trim(),
        description: t.description.trim(),
        price: toInt(t.price),
        capacity: toInt(t.capacity),
        sold: t.sold,
      }),
    ),
  };
}
