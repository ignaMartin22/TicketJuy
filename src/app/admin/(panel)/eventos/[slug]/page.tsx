import type { Metadata } from "next";
import { Suspense } from "react";
import { EventDetail } from "@/app/admin/_components/event-detail";
import { PanelLoading } from "@/app/admin/_components/loading";

export const metadata: Metadata = { title: "Evento" };

// Los eventos viven en el navegador: el slug se lee en el cliente.
export default function EventDetailPage() {
  return (
    <Suspense fallback={<PanelLoading />}>
      <EventDetail />
    </Suspense>
  );
}
