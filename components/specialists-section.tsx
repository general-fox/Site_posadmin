"use client";

import Link from "next/link";
import { useRef } from "react";
import { SITE_CONTACTS } from "@/lib/site-contacts";
import { ONSITE_GEOGRAPHY } from "@/lib/onsite-support";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { UiIcon } from "./ui-icon";
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
    id: "geography",
    title: "География работы",
    caption: "Удалённо и на месте",
    Content: () => <>
      <p>Осуществляем удалённую поддержку в любом регионе России 24/7.</p>
      <p>Выездное сопровождение подключается отдельно в следующих городах и регионах:</p>
      <p>{ONSITE_GEOGRAPHY.join(" · ")}</p>
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
    caption: "ИП Кимряков Александр Сергеевич",
    Content: () => <>
      <dl className={styles.requisites}>
        <div className={styles.requisiteWide}>
          <dt>Полное наименование</dt>
          <dd>Индивидуальный предприниматель Кимряков Александр Сергеевич</dd>
        </div>
        <div><dt>ИНН</dt><dd>501305826728</dd></div>
        <div><dt>ОГРНИП</dt><dd>315504000000628</dd></div>
        <div className={styles.requisiteWide}>
          <dt>Связь с менеджером</dt>
          <dd><a href={SITE_CONTACTS.phoneHref}>{SITE_CONTACTS.phone}</a> · {SITE_CONTACTS.managerHours}</dd>
        </div>
      </dl>
      <a className={ui.textLink} href={SITE_CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer">Запросить полные реквизиты <ArrowRight diagonal /></a>
    </>,
  },
];

export function SpecialistsSection() {
  const disclosureCentering = useDisclosureCentering();
  const headingRef = useRef<HTMLHeadingElement>(null);

  return <section id="about" className={styles.section} aria-labelledby="specialists-title">
    <div className={`${ui.shell} ${styles.layout}`}>
      <SectionReveal className={styles.intro}>
        <p className={ui.eyebrow}>О нас · Команда Posadmin</p>
        <h2 id="specialists-title" className={ui.heading} ref={headingRef}>О нас</h2>
      </SectionReveal>
      <SectionReveal className={styles.questions} motion="lift" sequence blur={false} after={headingRef}>
        {COMPANY_DETAILS.map(({ id, title, caption, Content }) => (
          <details key={id} className={styles.question} id={`about-${id}`} name="about-questions" data-reveal-item="" {...disclosureCentering}>
            <summary className={styles.questionTitle}>
              <h3>{title}</h3>
              <span className={styles.questionCaption}>{caption}</span>
              <span className={styles.toggle} aria-hidden="true">
                <UiIcon name="plus" size={20} />
                <UiIcon name="minus" size={20} />
              </span>
            </summary>
            <div className={styles.answer}><Content /></div>
          </details>
        ))}
      </SectionReveal>
    </div>
  </section>;
}
