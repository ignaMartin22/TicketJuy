import type { Metadata } from "next";
import { SalesOverview } from "./_components/sales-overview";

export const metadata: Metadata = { title: "Resumen" };

export default function AdminHomePage() {
  return <SalesOverview />;
}
