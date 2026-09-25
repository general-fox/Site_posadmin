import Link from "next/link";
import { Breadcrumbs, ServiceArrow, ServicePageFrame } from "@/components/service-page-frame";
import { buildPageMetadata } from "@/lib/seo";
import { SERVICES } from "@/lib/services";
import styles from "@/components/service-pages.module.css";

export const metadata = buildPageMetadata({
  title: "Услуги для ресторанов: автоматизация и IT-поддержка",
  description: "Услуги Posadmin: автоматизация ресторанов, поддержка r_keeper, IT-администрирование, ККТ, ГИС, выездные инженеры и интеграции. Выберите задачу вашего заведения.",
  path: "/services",
});

export default function ServicesPage() {
  return <ServicePageFrame>
    <div className={styles.shell}>
      <header className={styles.intro}>
        <Breadcrumbs items={[{ name: "Главная", path: "/" }, { name: "Услуги", path: "/services" }]} />
        <p className={styles.eyebrow}>Одна команда. Разные задачи.</p>
        <h1 className={styles.title}>Автоматизация и поддержка вашего заведения</h1>
        <p className={styles.lead}>От запуска r_keeper до ежедневной работы сети, касс и сервисов. Выберите направление — расскажем о составе работ и поможем собрать нужный набор услуг.</p>
        <div className={styles.actions}>
          <Link className={styles.button} href="/#pricing">Рассчитать сопровождение <ServiceArrow /></Link>
          <Link className={styles.textLink} href="/contacts">Обсудить задачу <ServiceArrow diagonal /></Link>
        </div>
      </header>
      <section className={styles.catalog} aria-label="Направления работы Posadmin">
        {SERVICES.map((service) => <Link className={styles.catalogRow} href={`/services/${service.slug}`} key={service.slug}>
          <h2>{service.navTitle}</h2>
          <p>{service.intro}</p>
          <ServiceArrow diagonal />
        </Link>)}
      </section>
    </div>
  </ServicePageFrame>;
}
