import Link from "next/link";
import { Breadcrumbs, ServiceArrow, ServicePageFrame } from "@/components/service-page-frame";
import { buildPageMetadata } from "@/lib/seo";
import { SERVICES } from "@/lib/services";
import styles from "@/components/service-pages.module.css";

const descriptions: Record<string, string> = {
  "avtomatizaciya-restoranov": "Запуск заведения: r_keeper, кассы, оборудование и сеть.",
  "soprovozhdenie-r-keeper": "Поддержка 24/7, настройка модулей, помощь на кассе и в зале.",
  "it-administrirovanie": "Сеть, Wi-Fi, компьютеры, телефония и резервное копирование.",
  "obsluzhivanie-kkt": "Регистрация касс, настройка и техническое сопровождение.",
  "egais-markirovka": "Техническая помощь с ЕГАИС, Честным знаком, Меркурием и ЭДО.",
  "vyezdnoe-soprovozhdenie": "Инженер на объекте: диагностика, настройка и обслуживание оборудования.",
  "integracii": "Связь между системами и автоматизация процессов вашего заведения.",
};

export const metadata = buildPageMetadata({
  title: "Услуги для ресторанов: автоматизация и IT-поддержка",
  description: "Услуги Posadmin: автоматизация ресторанов, поддержка r_keeper, IT-администрирование, ККТ, ГИС, выездные инженеры и интеграции. Выберите задачу вашего заведения.",
  path: "/services",
});

export default function ServicesPage() {
  return <ServicePageFrame>
    <div className={styles.shell}>
      <header className={styles.intro} data-scroll-reveal="">
        <Breadcrumbs items={[{ name: "Главная", path: "/" }, { name: "Услуги", path: "/services" }]} />
        <p className={styles.eyebrow}>Одна команда. Разные задачи.</p>
        <h1 className={styles.title}>Услуги для вашего заведения</h1>
        <p className={styles.lead}>Запуск, ежедневная поддержка и развитие. Выберите задачу — посмотрите состав работ и условия.</p>
        <div className={styles.actions}>
          <Link className={styles.button} href="/#pricing">Рассчитать сопровождение <ServiceArrow /></Link>
          <Link className={styles.textLink} href="/contacts">Обсудить задачу <ServiceArrow diagonal /></Link>
        </div>
      </header>
      <section className={styles.catalog} aria-label="Направления работы Posadmin">
        {SERVICES.map((service) => <Link className={styles.catalogRow} href={`/services/${service.slug}`} key={service.slug}>
          <h2>{service.navTitle}</h2>
          <p>{descriptions[service.slug] ?? service.intro}</p>
          <ServiceArrow diagonal />
        </Link>)}
      </section>
    </div>
  </ServicePageFrame>;
}
