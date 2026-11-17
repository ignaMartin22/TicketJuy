import Link from "next/link";

/** Marca de TicketJuy: la palabra en tipografía de afiche con un punto de neón. */
export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="display text-3xl">TicketJuy</span>
      <span className="neon-soft mt-2 size-2 rounded-full bg-accent" aria-hidden />
    </Link>
  );
}
