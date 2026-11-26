import type { Metadata } from "next";
import localFont from "next/font/local";
import { BackToTop } from "@/components/back-to-top";
import { ButtonEntrance } from "@/components/button-entrance";
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

const inter = localFont({
  src: "../public/fonts/inter/Inter-Variable.ttf",
  variable: "--font-inter-local",
  weight: "100 900",
  display: "swap",
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
    <html lang="ru" data-scroll-behavior="smooth" className={inter.variable}>
      <body className="min-h-full antialiased">
        <noscript><style>{"[data-reveal-on-load] { opacity: 1 !important; } :is(button, summary, [role=button], input[type=button], input[type=submit], input[type=reset], [data-button-reveal]) { scale: none !important; filter: none !important; }"}</style></noscript>
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [organizationJsonLd, websiteJsonLd],
        }} />
        {children}
        <BackToTop />
        <ButtonEntrance />
      </body>
    </html>
  );
}
