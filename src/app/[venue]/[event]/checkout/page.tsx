import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { eventParams, getEventCatalog, hasLiveCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Finalizar compra" };

export function generateStaticParams() {
  return eventParams();
}

export default function CheckoutPage({ params }: PageProps<"/[venue]/[event]/checkout">) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
      <h1 className="display mb-6 text-4xl sm:mb-10 sm:text-5xl">Tus datos</h1>
      {/*
        La fecha (en la ruta) y el carrito (?t=...) salen de la URL: el formulario
        va dentro de Suspense, así al navegar el título y el lugar aparecen al instante.
      */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-noche-2" />}>
        <Checkout params={params} />
      </Suspense>
    </main>
  );
}

async function Checkout({ params }: { params: PageProps<"/[venue]/[event]/checkout">["params"] }) {
  const { venue: venueSlug, event: eventSlug } = await params;
  const catalog = await getEventCatalog(venueSlug, eventSlug);
  if (!catalog) notFound();
  return <CheckoutForm venue={catalog.venue} event={catalog.event} live={hasLiveCatalog()} />;
}
