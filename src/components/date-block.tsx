import { nightParts } from "@/lib/format";

/** Fecha como en las carteleras: número grande, mes y día chicos. */
export function DateBlock({ iso, className = "" }: { iso: string; className?: string }) {
  const d = nightParts(iso);
  return (
    <div className={`flex w-14 shrink-0 flex-col items-center text-center ${className}`}>
      <span className="display text-5xl tabular-nums">{d.day}</span>
      <span className="mt-1 text-sm font-semibold capitalize text-accent">
        {d.month}
      </span>
      <span className="text-sm capitalize text-tenue">{d.weekday.slice(0, 3)}</span>
    </div>
  );
}
