import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Управление прайсом — Posadmin" },
  description: "Личный кабинет управления ценами Posadmin.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
  referrer: "no-referrer",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
