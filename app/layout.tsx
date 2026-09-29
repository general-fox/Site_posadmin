import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { BackToTop } from "@/components/back-to-top";
import { JsonLd } from "@/components/json-ld";
import {
  buildPageMetadata,
  organizationJsonLd,
  SITE_DESCRIPTION,
  SITE_URL,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";
import { IS_REVIEW_DEMO } from "@/lib/demo-mode";

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
  ...buildPageMetadata({
    title: "Автоматизация ресторанов и поддержка r_keeper",
    description: SITE_DESCRIPTION,
    path: "/",
  }),
  metadataBase: new URL(SITE_URL),
  applicationName: "Posadmin",
  robots: {
    index: !IS_REVIEW_DEMO,
    follow: !IS_REVIEW_DEMO,
    googleBot: {
      index: !IS_REVIEW_DEMO,
      follow: !IS_REVIEW_DEMO,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" className={`${inter.variable} ${montserrat.variable}`}>
      <body className="min-h-full antialiased">
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [organizationJsonLd, websiteJsonLd],
        }} />
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
