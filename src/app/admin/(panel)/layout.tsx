import { AdminShell } from "../_components/admin-shell";

/** Las pantallas del panel, con el menú. El ingreso (/admin/ingresar) queda afuera. */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
