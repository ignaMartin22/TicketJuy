import type { Metadata } from "next";
import { Suspense } from "react";
import { EditEventEditor } from "../../../_components/event-editors";
import { PanelLoading } from "../../../_components/loading";

export const metadata: Metadata = { title: "Editar evento" };

export default function EditEventPage() {
  return (
    <Suspense fallback={<PanelLoading />}>
      <EditEventEditor />
    </Suspense>
  );
}
