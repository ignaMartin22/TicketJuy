import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mis listas",
  robots: { index: false },
};

export default function RrppLayout({ children }: LayoutProps<"/rrpp">) {
  return <>{children}</>;
}
