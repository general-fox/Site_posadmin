import Link from "next/link";
import { Breadcrumbs, ServiceArrow, ServicePageFrame } from "@/components/service-page-frame";
import { ContactsSection } from "@/components/contacts-section";
import { ContactPageIntro } from "@/components/contact-page-intro";
import { JsonLd } from "@/components/json-ld";
import { SectionReveal } from "@/components/marketing-ui";
import { buildPageMetadata, SITE_URL } from "@/lib/seo";
import { ONSITE_GEOGRAPHY } from "@/lib/onsite-support";
import { SITE_CONTACTS } from "@/lib/site-contacts";
import styles from "@/components/service-pages.module.css";

export const metadata = buildPageMetadata({
  title: "Контакты — офисы в Люберцах и Новороссийске",
  description: "Свяжитесь с Posadmin по телефону 8 (800) 600-40-36 или в Telegram. Адреса офисов в Люберцах и Новороссийске, часы работы менеджера и города выездного обслуживания.",
  path: "/contacts",
});

export default function ContactsPage() {
  return <ServicePageFrame page="contacts" closing={<ContactsSection flushTop />}>
    <JsonLd data={{ "@context": "https://schema.org", "@graph": [
      { "@type": "ContactPage", "@id": `${SITE_URL}/contacts#page`, url: `${SITE_URL}/contacts`, name: "Контакты Posadmin", inLanguage: "ru-RU", about: { "@id": `${SITE_URL}/#organization` }, isPartOf: { "@id": `${SITE_URL}/#website` } },
      ...SITE_CONTACTS.offices.map((office, index) => ({
        "@type": "LocalBusiness",
        "@id": `${SITE_URL}/contacts#office-${index + 1}`,
        name: `Posadmin — ${office.city}`,
        url: `${SITE_URL}/contacts#office-${index + 1}`,
        parentOrganization: { "@id": `${SITE_URL}/#organization` },
        telephone: SITE_CONTACTS.phoneHref.replace(/^tel:8/, "+7"),
        address: { "@type": "PostalAddress", addressCountry: "RU", addressRegion: office.region, addressLocality: office.city, streetAddress: office.street },
        hasMap: `https://yandex.ru/maps/?text=${encodeURIComponent(office.mapQuery)}`,
      })),
    ] }} />
    <div className={styles.shell}>
      <ContactPageIntro
        breadcrumbs={<Breadcrumbs items={[{ name: "Главная", path: "/" }, { name: "Контакты", path: "/contacts" }]} />}
        actions={<>
          <a className={styles.button} href={SITE_CONTACTS.phoneHref} data-reveal-item="">{SITE_CONTACTS.phone}</a>
          <a className={styles.textLink} href={SITE_CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer" data-reveal-item="">Написать в Telegram <ServiceArrow diagonal /></a>
        </>}
      />
      <section className={styles.contactNote} aria-labelledby="onsite-geography">
        <SectionReveal>
          <h2 id="onsite-geography">Где доступно выездное сопровождение</h2>
          <p>{ONSITE_GEOGRAPHY.join(", ")}.</p>
          <Link className={styles.textLink} href="/#pricing">Тарифы и выездное сопровождение <ServiceArrow /></Link>
        </SectionReveal>
      </section>
    </div>
  </ServicePageFrame>;
}
