"use client";

import Link from "next/link";
import { useScrollReveal } from "./marketing-ui";
import styles from "./services-list.module.css";

const SERVICES = [
  {
    title: "Сопровождение r_keeper",
    href: "/services/soprovozhdenie-r-keeper",
    detail: "Настройка и поддержка касс и станций 24/7.",
  },
  {
    title: "Автоматизация ресторанов",
    href: "/services/avtomatizaciya-restoranov",
    detail: "Запуск r_keeper, оборудования и сети.",
  },
  {
    title: "IT-администрирование",
    href: "/services/it-administrirovanie",
    detail: "Сети, серверы и рабочие места.",
  },
  {
    title: "ЕГАИС и маркировка",
    href: "/services/egais-markirovka",
    detail: "ЕГАИС, Честный знак, Меркурий и ЭДО.",
  },
  {
    title: "Кассовая техника",
    href: "/services/obsluzhivanie-kkt",
    detail: "Регистрация и сопровождение ККТ.",
  },
  {
    title: "Выездное сопровождение",
    href: "/services/vyezdnoe-soprovozhdenie",
    detail: "Монтаж оборудования и устранение сбоев.",
  },
  {
    title: "Разработка и интеграции",
    href: "/services/integracii",
    detail: "Соединяем системы и автоматизируем процессы.",
  },
] as const;

function ServiceRow({ service, index }: { service: typeof SERVICES[number]; index: number }) {
  const ref = useScrollReveal<HTMLLIElement>({ delay: 0.1 + index * 0.055, distance: 8 });

  return (
    <li ref={ref} className={styles.row}>
      <Link href={service.href} className={styles.link}>
        <h3>{service.title}</h3>
        <p>{service.detail}</p>
        <svg className={styles.arrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg>
      </Link>
    </li>
  );
}

export function ServicesList() {
  return (
    <ul className={styles.list} aria-label="Услуги Posadmin">
      {SERVICES.map((service, index) => <ServiceRow key={service.title} service={service} index={index} />)}
    </ul>
  );
}
