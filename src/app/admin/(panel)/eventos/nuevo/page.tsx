import type { Metadata } from "next";
import { NewEventEditor } from "@/app/admin/_components/event-editors";

export const metadata: Metadata = { title: "Nuevo evento" };

export default function NewEventPage() {
  return <NewEventEditor />;
}
