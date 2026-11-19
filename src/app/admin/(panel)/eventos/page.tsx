import type { Metadata } from "next";
import { EventList } from "@/app/admin/_components/event-list";

export const metadata: Metadata = { title: "Eventos" };

export default function AdminEventsPage() {
  return <EventList />;
}
