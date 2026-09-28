import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, ServiceArrow, ServicePageFrame } from "@/components/service-page-frame";
import { JsonLd } from "@/components/json-ld";
import { buildPageMetadata, serviceJsonLd } from "@/lib/seo";
import { getServiceBySlug, SERVICES } from "@/lib/services";
import { SITE_CONTACTS } from "@/lib/site-contacts";
import styles from "@/components/service-pages.module.css";
import { getPricingSnapshot } from "@/lib/pricing-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };
// Known services are generated at build time; unknown slugs use notFound()
// below so Next handles them without the disabled-fallback error path.

export function generateStaticParams() {
  return SERVICES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getServiceBySlug((await params).slug);
  if (!service) notFound();
  return buildPageMetadata({ title: service.title, description: service.description, path: `/services/${service.slug}` });
}

export default async function ServicePage({ params }: Props) {
  const pricing = getPricingSnapshot().config;
  const service = getServiceBySlug((await params).slug, pricing);
  if (!service) notFound();
  const related = service.relatedSlugs.map((slug) => getServiceBySlug(slug, pricing)).filter((item) => item !== undefined);

  return <ServicePageFrame>
    <JsonLd data={serviceJsonLd(service)} />
    <div className={styles.shell}>
      <header className={styles.intro} data-scroll-reveal="">
        <Breadcrumbs items={[{ name: "Главная", path: "/" }, { name: "Услуги", path: "/services" }, { name: service.navTitle, path: `/services/${service.slug}` }]} />
        <p className={styles.eyebrow}>Команда Posadmin</p>
        <h1 className={styles.title}>{service.title}</h1>
        <p className={styles.lead}>{service.intro}</p>
        <div className={styles.actions}>
          <Link className={styles.button} href={service.pricing?.href ?? "/contacts"}>{service.pricing ? "Рассчитать сопровождение" : "Обсудить задачу"} <ServiceArrow /></Link>
          <a className={styles.textLink} href={SITE_CONTACTS.phoneHref}>{SITE_CONTACTS.phone}</a>
        </div>
      </header>
      <div className={styles.body}>
        <article className={styles.article} aria-label={service.title}>
          {service.sections.map((section, index) => <section className={styles.section} key={section.title} id={`section-${index + 1}`} aria-labelledby={`section-title-${index + 1}`}>
            <h2 id={`section-title-${index + 1}`}>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.items && <ul className={styles.items}>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
          </section>)}
          <section className={`${styles.section} ${styles.faq}`} id="questions" aria-labelledby="questions-title">
            <h2 id="questions-title">Частые вопросы</h2>
            {service.faq.map(({ question, answer }) => <details key={question}>
              <summary>{question}</summary><p>{answer}</p>
            </details>)}
          </section>
        </article>
        <aside className={styles.aside} aria-label="Навигация и стоимость">
          <nav aria-label="На этой странице">
            {service.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.title}>{section.title}</a>)}
            <a href="#questions">Частые вопросы</a>
          </nav>
          <h2>{service.pricing ? "Стоимость сопровождения" : "Начнём с вашей задачи"}</h2>
          <p>{service.pricing?.text ?? "Расскажите, что нужно настроить или изменить. Уточним конфигурацию и согласуем состав работ."}</p>
          <Link className={styles.button} href={service.pricing?.href ?? "/contacts"}>{service.pricing ? "Рассчитать стоимость" : "Связаться с командой"}<ServiceArrow /></Link>
          {service.pricing && <p>Предварительный расчёт. Окончательный состав работ и цена фиксируются в договоре.</p>}
          {service.slug === "integracii" && <Link className={styles.textLink} href="/#products">Продукты Posadmin <ServiceArrow /></Link>}
        </aside>
      </div>
      <section className={styles.related} aria-labelledby="related-title">
        <h2 id="related-title">Для связанных задач</h2>
        <div className={styles.relatedLinks}>{related.map((item) => <Link className={styles.textLink} href={`/services/${item.slug}`} key={item.slug}>{item.navTitle}<ServiceArrow diagonal /></Link>)}</div>
      </section>
    </div>
  </ServicePageFrame>;
}
