import type { Metadata } from "next";
import "./puerta.css";

export const metadata: Metadata = {
  title: "Portería",
  robots: { index: false },
};

export default function PuertaLayout({ children }: LayoutProps<"/puerta">) {
  return <>{children}</>;
}
