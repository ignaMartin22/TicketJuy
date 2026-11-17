import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { events, getEvent, getVenue } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Finalizar compra" };

export function generateStaticParams() {
  return events.map((e) => ({ venue: e.venueSlug, event: e.slug }));
}

export default async function CheckoutPage({
  params,
}: PageProps<"/[venue]/[event]/checkout">) {
  const { venue: venueSlug, event: eventSlug } = await params;
  const venue = getVenue(venueSlug);
  const event = getEvent(venueSlug, eventSlug);
  if (!venue || !event) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
      <h1 className="display mb-5 text-5xl sm:mb-8 sm:text-6xl uppercase">Tus datos</h1>
      {/* El carrito viene en la URL (?t=...), que se lee al momento del pedido. */}
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-2xl bg-noche-2" />}
      >
        <CheckoutForm venue={venue} event={event} />
      </Suspense>
    </main>
  );
}
