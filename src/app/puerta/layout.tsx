import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portería",
  robots: { index: false },
};

export default function PuertaLayout({ children }: LayoutProps<"/puerta">) {
  return <>{children}</>;
}
