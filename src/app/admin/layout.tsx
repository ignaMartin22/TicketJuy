import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel" },
  robots: { index: false, follow: false },
};

// /admin queda protegido por la sesión del personal: el proxy y el guardián
// del layout de (panel) mandan a /ingresar si no hay token válido.
// Sin TICKETERA_API_URL el panel entra en modo demo con sesión de demostración.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
