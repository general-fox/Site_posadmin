import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "lenis/dist/lenis.css";
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
    <html lang="ru" className={`${inter.variable} ${montserrat.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                history.scrollRestoration = "manual";
                const navigation = performance.getEntriesByType("navigation")[0];
                if (navigation && navigation.type === "reload") {
                  window.scrollTo(0, 0);
                }
              } catch {}
            `,
          }}
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
