import type { Event, Ticket, TicketType, Venue } from "@/lib/mock-data";
import { nightParts } from "@/lib/format";

const STATUS_LABEL: Record<Ticket["status"], string> = {
  valid: "Válida para ingresar",
  used: "Ya usada",
  transferred: "Transferida",
  void: "Anulada",
};

const STAMP: Record<Ticket["status"], string | null> = {
  valid: null,
  used: "Usada",
  transferred: "Transferida",
  void: "Anulada",
};

/**
 * La entrada: tarjeta oscura con borde de neón, troquel con muescas y el QR
 * sobre blanco (se escanea con poca luz en la puerta). Cuando ya no sirve (usada,
 * transferida o anulada) el cartel se apaga: sin brillo, sin color y con el sello.
 */
export function TicketStub({
  venue,
  event,
  type,
  ticket,
  qr,
  className = "",
  live = false,
  big = false,
}: {
  venue: Venue;
  event: Event;
  type: TicketType;
  ticket: Pick<Ticket, "code" | "status" | "note"> & { holderName?: string };
  qr: string;
  className?: string;
  /** Versión animada de la portada: sin brillo propio (lo pone el anillo) y con escáner. */
  live?: boolean;
  /** Versión para mostrar en la puerta: QR al ancho de la tarjeta y estado a la vista. */
  big?: boolean;
}) {
  const d = nightParts(event.startsAt);
  const stamp = STAMP[ticket.status];
  const off = stamp !== null;

  return (
    <article
      className={`${off ? "entrada-apagada" : live ? "" : "neon"} relative w-full ${big ? "max-w-sm" : "max-w-[22rem]"} overflow-hidden rounded-[1.75rem] bg-noche-2 ${className}`}
    >
      <header className={`px-6 ${big ? "pb-3 pt-5" : "pb-5 pt-6"}`}>
        <p className="text-sm font-semibold text-accent">
          {venue.name}, {venue.city}
        </p>
        <h2 className={`display mt-2 uppercase text-balance ${big ? "text-2xl" : "text-3xl"}`}>
          {event.title}
        </h2>
        <p className={`capitalize ${big ? `mt-2 text-base ${off ? "" : "text-luz"}` : "mt-3 text-sm text-tenue"}`}>
          {d.weekday} {d.day} {d.month}, {d.time} h
        </p>
      </header>

      {/* Troquel */}
      <div className="relative h-6" aria-hidden>
        <span className="absolute -left-3 top-0 size-6 rounded-full bg-noche shadow-[inset_-1px_0_0_color-mix(in_oklab,var(--accent)_70%,transparent)]" />
        <span className="absolute -right-3 top-0 size-6 rounded-full bg-noche shadow-[inset_1px_0_0_color-mix(in_oklab,var(--accent)_70%,transparent)]" />
        <span className="absolute inset-x-5 top-1/2 border-t border-dashed border-luz/20" />
      </div>

      <div className={`relative flex flex-col items-center pb-2 ${big ? "px-4 pt-3" : "px-6 pt-4"}`}>
        <div
          className={`w-full ${big ? "max-w-72" : "max-w-52"} rounded-2xl bg-white p-3 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full ${
            off ? "opacity-10 grayscale" : ""
          }`}
          role="img"
          aria-label={`Código QR de la entrada ${ticket.code}`}
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        {live && !stamp && (
          <div className="pointer-events-none absolute inset-x-6 top-4 mx-auto aspect-square max-w-52" aria-hidden>
            <span className="escaner" />
          </div>
        )}
        {stamp && (
          <p className="display absolute top-[42%] -translate-y-1/2 -rotate-12 rounded-lg border-2 border-current px-4 py-1 text-3xl uppercase text-luz/70">
            {stamp}
          </p>
        )}
        <p className="mt-3 font-semibold tracking-[0.15em] tabular-nums">
          {ticket.code}
        </p>
        {ticket.note && <p className="mt-1 text-sm text-tenue">{ticket.note}</p>}
      </div>

      <dl className={`grid grid-cols-2 gap-x-4 gap-y-3 px-6 pb-6 pt-4 ${big ? "text-base" : "text-sm"}`}>
        {ticket.holderName && (
          <div>
            <dt className="text-tenue">Titular</dt>
            <dd className="font-semibold">{ticket.holderName}</dd>
          </div>
        )}
        <div className={ticket.holderName ? undefined : "col-span-2"}>
          <dt className="text-tenue">Entrada</dt>
          <dd className="font-semibold">{type.name}</dd>
        </div>
        {big && (
          <div className="col-span-2">
            <dt className="sr-only">Estado</dt>
            <dd
              // Es un estado, no un botón: borde y punto, sin relleno que invite a tocar.
              className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2 font-semibold ${
                ticket.status === "valid"
                  ? "border-accent/60 text-accent"
                  : "border-linea text-tenue"
              }`}
            >
              <span
                className={`size-2 rounded-full ${ticket.status === "valid" ? "neon-soft bg-accent" : "bg-tenue"}`}
                aria-hidden
              />
              {STATUS_LABEL[ticket.status]}
            </dd>
          </div>
        )}
      </dl>
    </article>
  );
}
