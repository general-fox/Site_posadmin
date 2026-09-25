"use client";

import Link from "next/link";
import { useScrollReveal } from "./marketing-ui";
import styles from "./services-list.module.css";

const SERVICES = [
  {
    title: "r_keeper",
    href: "/services/soprovozhdenie-r-keeper",
    detail: "Автоматизация и сопровождение.",
  },
  {
    title: "Системные администраторы",
    href: "/services/it-administrirovanie",
    detail: "Сети, серверы и рабочие места.",
  },
  {
    title: "ГИС-системы",
    href: "/services/egais-markirovka",
    detail: "ЕГАИС, Честный знак, Меркурий и ЭДО.",
  },
  {
    title: "Кассовая техника",
    href: "/services/obsluzhivanie-kkt",
    detail: "Регистрация и сопровождение ККТ.",
  },
  {
    title: "Выездные инженеры",
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
      <h3><Link href={service.href}>{service.title}</Link></h3>
      <p>{service.detail}</p>
    </li>
  );
}

export function ServicesList() {
  return (
    <ul className={styles.list} aria-label="Направления работы команды">
      {SERVICES.map((service, index) => <ServiceRow key={service.title} service={service} index={index} />)}
    </ul>
  );
}
