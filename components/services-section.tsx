import Link from "next/link";
import { SERVICES } from "@/lib/services";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import ui from "./marketing.module.css";
import styles from "./services-section.module.css";

const directions = [
  {
    slug: "soprovozhdenie-r-keeper",
    label: "Поддержка 24/7",
    description: "Настройка модулей, обновления и помощь сотрудникам на кассе и в зале. Удалённое сопровождение ККТ и ГИС — в базовом модуле.",
    featured: true,
  },
  {
    slug: "it-administrirovanie",
    label: "Отдельный набор услуг",
    description: "Сеть, Wi-Fi, компьютеры, телефония и резервное копирование. Поддерживаем инфраструктуру, от которой зависит работа заведения.",
    featured: true,
  },
  {
    slug: "avtomatizaciya-restoranov",
    description: "Запуск заведения: r_keeper, кассы, оборудование и сеть. Состав работ и смету собираем под ваш проект.",
  },
  {
    slug: "obsluzhivanie-kkt",
    description: "Регистрация касс, настройка и техническое сопровождение. Удалённая поддержка входит в базовый модуль r_keeper.",
  },
  {
    slug: "egais-markirovka",
    description: "Техническая помощь с ЕГАИС, Честным знаком, Меркурием и ЭДО. Удалённая поддержка ГИС входит в базовый модуль r_keeper.",
  },
  {
    slug: "vyezdnoe-soprovozhdenie",
    description: "Диагностика, настройка и обслуживание оборудования на месте. Дополнительный модуль; доступность зависит от города.",
  },
  {
    slug: "integracii",
    description: "Связываем системы и автоматизируем процессы вашего заведения. Разработку и новые интеграции оцениваем по задаче.",
  },
] as const;

export function ServicesSection() {
  return (
    <section id="services" className={`${ui.section} ${styles.section}`} aria-labelledby="services-title">
      <div className={ui.shell}>
        <div className={ui.sectionHeader}>
          <SectionReveal distance={22}>
            <p className={ui.eyebrow}>Услуги Posadmin</p>
            <h2 id="services-title" className={ui.heading}>Услуги для<br /><span className={ui.muted}>вашего заведения</span></h2>
          </SectionReveal>
          <SectionReveal distance={18} delay={0.12}>
            <p className={ui.lead}>Выберите, что нужно вашему заведению. В каждом направлении — состав работ, условия и ответы на частые вопросы.</p>
          </SectionReveal>
        </div>

        <ul className={styles.catalog}>
          {directions.map((direction, index) => {
            const service = SERVICES.find(({ slug }) => slug === direction.slug)!;
            const featured = "featured" in direction;

            return (
              <li className={featured ? styles.featuredItem : styles.detailItem} key={direction.slug}>
                <SectionReveal className={styles.reveal} distance={18} delay={featured ? index * 0.08 : 0}>
                  <Link
                    className={`${styles.serviceLink} ${featured ? styles.featuredLink : styles.detailLink} ${index === 0 ? styles.primaryService : ""}`}
                    href={`/services/${service.slug}`}
                  >
                    {"label" in direction && <span className={styles.label}>{direction.label}</span>}
                    <h3>{service.navTitle}</h3>
                    <p>{direction.description}</p>
                    {featured ? (
                      <span className={styles.featuredAction}>Состав сопровождения <ArrowRight diagonal /></span>
                    ) : (
                      <span className={styles.arrow}><ArrowRight diagonal /></span>
                    )}
                  </Link>
                </SectionReveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
