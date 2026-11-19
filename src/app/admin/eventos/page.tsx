import type { Metadata } from "next";
import { EventList } from "../_components/event-list";

export const metadata: Metadata = { title: "Eventos" };

export default function AdminEventsPage() {
  return <EventList />;
}
