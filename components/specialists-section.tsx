"use client";

import Link from "next/link";
import { SITE_CONTACTS } from "@/lib/site-contacts";
import { ONSITE_SUPPORT_LOCATIONS } from "@/lib/onsite-support";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { SectionAtmosphere } from "./section-atmosphere";
import { useDisclosureCentering } from "./use-disclosure-centering";
import ui from "./marketing.module.css";
import styles from "./specialists-section.module.css";

const PRINCIPLES = [
  {
    title: "Отвечаем за свою работу",
    text: "Заранее согласуем состав работ, сроки и границы ответственности. Отвечаем за качество в рамках этих обязательств.",
  },
  {
    title: "Видим систему целиком",
    text: "Ищем причину проблемы и оцениваем последствия решения для касс, учёта и инфраструктуры — не только для одной настройки.",
  },
  {
    title: "Говорим честно и понятно",
    text: "Объясняем варианты и ограничения, обсуждаем изменения заранее. Уважаем вашу команду и помогаем разобраться в технических вопросах.",
  },
  {
    title: "Развиваем экспертизу",
    text: "Учимся, делимся опытом и совершенствуем инструменты. Предлагаем улучшения, когда видим, что они помогут работе заведения.",
  },
] as const;

const COMPANY_DETAILS = [
  {
    id: "geography",
    title: "География работы",
    caption: "Удалённо и на месте",
    Content: () => <>
      <p>Удалённая техническая поддержка работает круглосуточно. Когда задачу нужно решать на объекте, выездное сопровождение подключается отдельно.</p>
      <h4 className={styles.detailLabel}>Города и регионы выездного сопровождения</h4>
      <ul className={styles.locations}>
        {ONSITE_SUPPORT_LOCATIONS.map(({ id, name }) => <li key={id}>{name}</li>)}
      </ul>
      <p className={styles.note}>Для других городов возможность выезда обсуждаем с менеджером — в зависимости от проекта.</p>
    </>,
  },
  {
    id: "offices",
    title: "Наши офисы",
    caption: "Люберцы и Новороссийск",
    Content: () => <div className={styles.offices}>
      {SITE_CONTACTS.offices.map((office) => <div className={styles.office} key={office.city}>
        <p className={styles.officeRegion}>{office.region}</p>
        <h4>{office.city}</h4>
        <address>{office.street}</address>
        <a
          className={styles.answerLink}
          href={`https://yandex.ru/maps/?text=${encodeURIComponent(office.mapQuery)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${office.city}: открыть адрес на Яндекс Картах`}
        >Открыть на карте <ArrowRight diagonal /></a>
      </div>)}
    </div>,
  },
  {
    id: "company-details",
    title: "Карточка компании и реквизиты",
    caption: "По запросу",
    Content: () => <>
      <p>Запросите у менеджера карточку компании и реквизиты для проверки контрагента или подготовки договора.</p>
      <div className={styles.contactLinks}>
        <a className={styles.answerLink} href={SITE_CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer">Запросить в Telegram <ArrowRight diagonal /></a>
        <a className={styles.answerLink} href={SITE_CONTACTS.phoneHref}>{SITE_CONTACTS.phone} <ArrowRight diagonal /></a>
      </div>
      <p className={styles.note}>Менеджер на связи: {SITE_CONTACTS.managerHours.toLowerCase()}.</p>
    </>,
  },
];

export function SpecialistsSection() {
  const disclosureCentering = useDisclosureCentering();

  return <section id="about" className={`${styles.section} section-atmosphere-host`} aria-labelledby="specialists-title">
    <SectionAtmosphere />
    <div className={styles.shell}>
      <div className={styles.intro}>
        <SectionReveal distance={22}>
          <p className={ui.eyebrow}>О нас · Команда Posadmin</p>
          <h2 id="specialists-title">Команда, на которую<br /><span>можно опереться</span></h2>
        </SectionReveal>
        <SectionReveal className={styles.description} distance={18} delay={0.12}>
          <p>Автоматизируем заведения HoReCa — от первого проекта до ежедневной работы. <strong>Согласуем обязательства и ведём задачу целиком,</strong> чтобы технические вопросы не оставались между несколькими подрядчиками.</p>
        </SectionReveal>
      </div>

      <dl className={styles.facts} aria-label="Опыт и компетенции Posadmin">
        <div><dt><span>15+</span> лет</dt><dd>автоматизируем бизнес</dd></div>
        <div><dt><span>1 000+</span></dt><dd>запущенных объектов</dd></div>
        <div><dt><span>24/7</span></dt><dd>удалённая техподдержка</dd></div>
        <div><dt className={styles.dealer}>r_keeper</dt><dd>официальный дилер</dd></div>
      </dl>

      <div className={styles.principles} aria-labelledby="about-principles-title">
        <div className={styles.principlesHeading}>
          <p className={styles.label}>Наш подход</p>
          <h3 id="about-principles-title">Ищем решение,<br /><span>а не оправдания</span></h3>
          <Link href="#clients-title" className={ui.textLink}>Кто нам доверяет <ArrowRight diagonal /></Link>
        </div>
        <ol className={styles.principleList}>
          {PRINCIPLES.map(({ title, text }, index) => <li key={title}>
            <span className={styles.principleNumber} aria-hidden="true">0{index + 1}</span>
            <div><h4>{title}</h4><p>{text}</p></div>
          </li>)}
        </ol>
      </div>

      <div className={styles.scope}>
        <div>
          <h3>Весь технический контур</h3>
          <p>r_keeper и кассы, учётные системы, оборудование, сеть и рабочие места — в одной команде.</p>
        </div>
        <nav className={styles.directions} aria-label="Направления работы Posadmin">
          <Link href="#launch"><span>Проект<small>Запуск и развитие</small></span><ArrowRight /></Link>
          <Link href="#pricing"><span>Сопровождение<small>Ежедневная работа</small></span><ArrowRight /></Link>
        </nav>
      </div>

      <div className={styles.questions}>
        {COMPANY_DETAILS.map(({ id, title, caption, Content }) => (
          <details key={id} onClick={disclosureCentering.onClick} className={styles.question} id={`about-${id}`} name="about-questions">
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
