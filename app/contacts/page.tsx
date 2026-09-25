import Link from "next/link";
import { Breadcrumbs, ServiceArrow, ServicePageFrame } from "@/components/service-page-frame";
import { ContactsSection } from "@/components/contacts-section";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata, SITE_URL } from "@/lib/seo";
import { ONSITE_SUPPORT_LOCATIONS } from "@/lib/onsite-support";
import { SITE_CONTACTS } from "@/lib/site-contacts";
import styles from "@/components/service-pages.module.css";

export const metadata = buildPageMetadata({
  title: "Контакты — офисы в Люберцах и Новороссийске",
  description: "Свяжитесь с Posadmin по телефону 8 (800) 600-40-36 или в Telegram. Адреса офисов в Люберцах и Новороссийске, часы работы менеджера и города выездного обслуживания.",
  path: "/contacts",
});

export default function ContactsPage() {
  return <ServicePageFrame page="contacts">
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
      <header className={styles.intro}>
        <Breadcrumbs items={[{ name: "Главная", path: "/" }, { name: "Контакты", path: "/contacts" }]} />
        <p className={styles.eyebrow}>На связи с вашим заведением</p>
        <h1 className={styles.title}>Контакты Posadmin</h1>
        <p className={styles.lead}>Обсудим запуск, сопровождение или развитие вашей системы. Наши офисы находятся в Люберцах и Новороссийске, а техническая поддержка работает 24/7.</p>
        <div className={styles.actions}>
          <a className={styles.button} href={SITE_CONTACTS.phoneHref}>{SITE_CONTACTS.phone}</a>
          <a className={styles.textLink} href={SITE_CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer">Написать в Telegram <ServiceArrow diagonal /></a>
        </div>
      </header>
      <section className={styles.contactNote} aria-labelledby="onsite-geography">
        <h2 id="onsite-geography">Где доступно выездное сопровождение</h2>
        <p>{ONSITE_SUPPORT_LOCATIONS.map(({ name }) => name).join(", ")}.</p>
        <Link className={styles.textLink} href="/services/vyezdnoe-soprovozhdenie">Состав и условия выездного модуля <ServiceArrow /></Link>
      </section>
    </div>
    <ContactsSection />
  </ServicePageFrame>;
}
