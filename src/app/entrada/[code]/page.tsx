import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TicketStub } from "@/components/ticket-stub";
import { getEvent, getTicket, getVenue, tickets } from "@/lib/mock-data";
import { qrSvg } from "@/lib/qr";

export const metadata: Metadata = {
  title: "Tu entrada",
  robots: { index: false },
};

export function generateStaticParams() {
  return tickets.map((t) => ({ code: t.code }));
}

const HELP: Record<string, string> = {
  valid:
    "Mostrá este QR en la puerta con el brillo al máximo. Sirve para un solo ingreso: no lo compartas.",
  used: "Esta entrada ya se usó para ingresar.",
  transferred: "Le pasaste esta entrada a otra persona. El QR nuevo lo tiene ella.",
  void: "Esta entrada fue anulada y no sirve para ingresar.",
};

export default async function TicketPage({
  params,
}: PageProps<"/entrada/[code]">) {
  const ticket = getTicket((await params).code);
  if (!ticket) notFound();
  const venue = getVenue(ticket.venueSlug);
  const event = getEvent(ticket.venueSlug, ticket.eventSlug);
  const type = event?.ticketTypes.find((t) => t.id === ticket.ticketTypeId);
  if (!venue || !event || !type) notFound();
  const qr = await qrSvg(ticket.code);

  return (
    <main
      className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-5"
      style={{ "--accent": venue.accent } as CSSProperties}
    >
      <TicketStub
        venue={venue}
        event={event}
        type={type}
        ticket={ticket}
        qr={qr}
        big
        className="entrada-aparece"
      />

      <p className="max-w-sm text-center text-tenue text-balance">
        {HELP[ticket.status]}
      </p>

      {ticket.status === "valid" && (
        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          {/* Próximas etapas: Wallet y transferencia (ver hoja de ruta). */}
          <button
            type="button"
            disabled
            className="min-h-12 rounded-full border border-linea text-sm font-semibold text-tenue"
            title="Próximamente"
          >
            Transferir
          </button>
          <button
            type="button"
            disabled
            className="min-h-12 rounded-full border border-linea text-sm font-semibold text-tenue"
            title="Próximamente"
          >
            Guardar en Wallet
          </button>
        </div>
      )}

      <Link href={`/${venue.slug}/${event.slug}`} className="py-3 text-tenue underline underline-offset-4">
        Ver la fecha
      </Link>
    </main>
  );
}
