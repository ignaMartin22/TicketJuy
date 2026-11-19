import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel" },
  robots: { index: false, follow: false },
};

// PENDIENTE: proteger /admin con el login del personal cuando ticketera-core tenga usuarios.
// Por ahora /admin/ingresar es sólo la pantalla: al enviar entra directo.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
