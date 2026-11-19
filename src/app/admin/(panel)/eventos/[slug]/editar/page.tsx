import type { Metadata } from "next";
import { Suspense } from "react";
import { EditEventEditor } from "@/app/admin/_components/event-editors";
import { PanelLoading } from "@/app/admin/_components/loading";

export const metadata: Metadata = { title: "Editar evento" };

export default function EditEventPage() {
  return (
    <Suspense fallback={<PanelLoading />}>
      <EditEventEditor />
    </Suspense>
  );
}
