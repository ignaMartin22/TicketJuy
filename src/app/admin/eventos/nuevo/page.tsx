import type { Metadata } from "next";
import { NewEventEditor } from "../../_components/event-editors";

export const metadata: Metadata = { title: "Nuevo evento" };

export default function NewEventPage() {
  return <NewEventEditor />;
}
