import type { Metadata } from "next";
import { AdminShell } from "./_components/admin-shell";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel" },
  robots: { index: false, follow: false },
};

// PENDIENTE: proteger con login del personal (admin) cuando exista Supabase Auth.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
