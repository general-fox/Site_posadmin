"use client";

import Image from "next/image";
import Link from "next/link";
import { SITE_CONTACTS } from "@/lib/site-contacts";
import { SITE_CLIENTS } from "@/lib/site-clients";
import { ONSITE_SUPPORT_LOCATIONS } from "@/lib/onsite-support";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { useDisclosureCentering } from "./use-disclosure-centering";
import ui from "./marketing.module.css";
import styles from "./specialists-section.module.css";

const COMPANY_DETAILS = [
  {
    id: "experience",
    title: "Опыт и компетенции",
    caption: "15+ лет · 1 000+ объектов",
    Content: () => <>
      <p>Более 15 лет автоматизируем заведения HoReCa. Запустили свыше 1 000 объектов. Официальный дилер r_keeper.</p>
      <p>Закрываем весь технический контур: r_keeper, кассы, учётные системы, оборудование, сеть и рабочие места.</p>
      <div className={styles.links}>
        <Link href="#pricing" className={ui.textLink}>Сопровождение <ArrowRight /></Link>
        <Link href="#launch" className={ui.textLink}>Запуск проекта <ArrowRight /></Link>
      </div>
    </>,
  },
  {
    id: "approach",
    title: "Как мы работаем",
    caption: "Одна команда · поддержка 24/7",
    Content: () => <ul className={styles.principles}>
      <li><strong>Один чат с командой.</strong> Менеджер подключает нужных специалистов; удалённая техподдержка работает круглосуточно.</li>
      <li><strong>Понятные обязательства.</strong> Заранее согласуем состав работ, сроки и ответственность. Честно говорим о вариантах и ограничениях.</li>
      <li><strong>Решение, а не симптом.</strong> Ищем причину сбоя, учитываем связанные системы и предлагаем полезные улучшения.</li>
    </ul>,
  },
  {
    id: "clients",
    title: "Нам доверяют",
    caption: "Рестораны и сети",
    Content: () => <>
      <p>Сопровождаем эти команды в ежедневной работе. Логотипы ведут на сайты заведений.</p>
      <ul className={styles.clients} aria-label="Клиенты Posadmin">
        {SITE_CLIENTS.map((client) => <li key={client.name}>
          <a href={client.href} target="_blank" rel="noopener noreferrer" aria-label={`${client.name} — сайт клиента (откроется в новой вкладке)`}>
            <Image src={client.src} alt={client.name} width={130} height={54} sizes="130px" />
            <ArrowRight diagonal />
          </a>
        </li>)}
      </ul>
    </>,
  },
  {
    id: "geography",
    title: "География работы",
    caption: "Удалённо и на месте",
    Content: () => <>
      <p>Удалённо решаем задачи 24/7. Выездное сопровождение подключается отдельно в следующих городах и регионах:</p>
      <p>{ONSITE_SUPPORT_LOCATIONS.map(({ name }) => name).join(" · ")}</p>
      <p className={styles.note}>Возможность выезда в другие города обсуждаем с менеджером.</p>
    </>,
  },
  {
    id: "offices",
    title: "Наши офисы",
    caption: "Люберцы и Новороссийск",
    Content: () => <div className={styles.offices}>
      {SITE_CONTACTS.offices.map((office) => <div key={office.city}>
        <h4>{office.city}</h4>
        <address>{office.street}</address>
        <a className={ui.textLink} href={`https://yandex.ru/maps/?text=${encodeURIComponent(office.mapQuery)}`} target="_blank" rel="noopener noreferrer" aria-label={`${office.city}: открыть адрес на Яндекс Картах`}>
          Открыть на карте <ArrowRight diagonal />
        </a>
      </div>)}
    </div>,
  },
  {
    id: "company-details",
    title: "Карточка компании и реквизиты",
    caption: "По запросу",
    Content: () => <>
      <p>Отправим карточку компании и реквизиты для проверки контрагента или подготовки договора.</p>
      <a className={ui.textLink} href={SITE_CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer">Запросить у менеджера <ArrowRight diagonal /></a>
    </>,
  },
];

export function SpecialistsSection() {
  const disclosureCentering = useDisclosureCentering();

  return <section id="about" className={styles.section} aria-labelledby="specialists-title">
    <div className={`${ui.shell} ${styles.layout}`}>
      <SectionReveal className={styles.intro} distance={12}>
        <p className={ui.eyebrow}>О нас · Команда Posadmin</p>
        <h2 id="specialists-title" className={ui.heading}>О нас</h2>
      </SectionReveal>
      <div className={styles.questions}>
        {COMPANY_DETAILS.map(({ id, title, caption, Content }) => (
          <details key={id} className={styles.question} id={`about-${id}`} name="about-questions" {...disclosureCentering}>
            <summary className={styles.questionTitle}>
              <h3>{title}</h3>
              <span className={styles.questionCaption}>{caption}</span>
              <span className={styles.toggle} aria-hidden="true"><span /><span /></span>
            </summary>
            <div className={styles.answer}><Content /></div>
          </details>
        ))}
      </div>
      <div className={styles.actions}>
        <Link href="/about" className={ui.textLink}>Подробнее о компании <ArrowRight diagonal /></Link>
      </div>
    </div>
  </section>;
}
