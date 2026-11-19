import type { ReactNode } from "react";
import { isPast } from "../_lib/dates";
import { percent } from "../_lib/stats";
import type { AdminEvent } from "../_lib/types";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="display text-4xl uppercase sm:text-5xl">{title}</h1>
        {description && <p className="mt-2 text-tenue">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const buttonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export const buttonClass = {
  primary: `${buttonBase} bg-accent text-accent-foreground hover:brightness-110`,
  secondary: `${buttonBase} border border-linea bg-noche-2 hover:border-accent/60`,
  danger: `${buttonBase} border border-error/40 text-error hover:bg-error/10`,
};

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-linea bg-noche-2 ${className}`}>
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-sm text-tenue">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-tenue">{hint}</p>}
    </Card>
  );
}

/** Barra de vendidas sobre cupo. */
export function SalesBar({
  sold,
  capacity,
  label,
}: {
  sold: number;
  capacity: number;
  label: string;
}) {
  const pct = percent(sold, capacity);
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-valuenow={sold}
      aria-valuetext={`${sold} de ${capacity} (${pct} %)`}
      className="h-2 overflow-hidden rounded-full bg-noche-3"
    >
      <div
        className={`h-full rounded-full ${pct >= 100 ? "bg-luz" : "bg-accent"}`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

type Status = { label: string; tone: string };

export function eventStatus(event: AdminEvent): Status {
  if (isPast(event.startsAt)) return { label: "Finalizado", tone: "text-tenue border-linea" };
  if (!event.salesOpen) return { label: "Venta pausada", tone: "text-amber-300 border-amber-300/40" };
  const soldOut = event.ticketTypes.every((t) => t.sold >= t.capacity);
  if (soldOut) return { label: "Agotado", tone: "text-luz border-luz/40" };
  return { label: "A la venta", tone: "text-emerald-300 border-emerald-300/40" };
}

export function StatusBadge({ event }: { event: AdminEvent }) {
  const s = eventStatus(event);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.tone}`}
    >
      {s.label}
    </span>
  );
}

/** Miniatura de la portada; sin foto, un bloque con la inicial del evento. */
export function EventThumb({ event, className = "" }: { event: AdminEvent; className?: string }) {
  if (event.cover) {
    return (
      // Data URL local: next/image no aporta nada acá.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={event.cover}
        alt=""
        className={`shrink-0 rounded-xl object-cover ${className}`}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`display flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/40 to-noche-3 text-2xl uppercase ${className}`}
    >
      {event.title.slice(0, 1)}
    </div>
  );
}
