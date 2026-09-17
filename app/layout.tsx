import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { BackToTop } from "@/components/back-to-top";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  axes: ["opsz"],
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "posadmin",
  description: "Автоматизация ресторанов под ключ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-full antialiased">
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
