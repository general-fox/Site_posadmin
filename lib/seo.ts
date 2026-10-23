import type { Metadata } from "next";
import { SITE_CONTACTS } from "@/lib/site-contacts";

export const SITE_URL = "https://posadmin.ru";
export const SITE_NAME = "Posadmin";
export const SITE_DESCRIPTION =
  "Запуск и автоматизация ресторанов, кафе и других предприятий HoReCa с нуля. r_keeper, оборудование, сеть и интеграции. Сопровождение по тарифам и расчёт запуска с менеджером.";

const socialImage = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "Posadmin — автоматизация ресторанов и поддержка r_keeper",
};

export function buildPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const pageTitle = `${title} — ${SITE_NAME}`;
  const url = new URL(path, SITE_URL).toString();

  return {
    title: { absolute: pageTitle },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
      title: pageTitle,
      description,
      url,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [socialImage],
    },
  };
}

const telephone = SITE_CONTACTS.phoneHref.replace(/^tel:8/, "+7");

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/icon.svg`,
    width: 180,
    height: 180,
  },
  telephone,
  address: SITE_CONTACTS.offices.map((office) => ({
    "@type": "PostalAddress",
    addressCountry: "RU",
    addressRegion: office.region,
    addressLocality: office.city,
    streetAddress: office.street,
  })),
  contactPoint: {
    "@type": "ContactPoint",
    telephone,
    contactType: "customer service",
    availableLanguage: ["ru"],
  },
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "ru-RU",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, SITE_URL).toString(),
    })),
  };
}
