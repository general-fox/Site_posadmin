"use client";

import { useState } from "react";
import { AboutHero } from "@/components/about-hero";
import { CallbackDialog } from "@/components/callback-dialog";
import { PhilosophySection } from "@/components/philosophy-section";
import { SiteHeader } from "@/components/site-header";
import { ClosingLayout } from "@/components/closing-layout";
import styles from "./about-page.module.css";
import ui from "./marketing.module.css";
import { SectionReveal } from "./marketing-ui";

const outcomes = [
  {
    number: "01",
    label: "Запуск объекта",
    title: "Запускаем",
    text: "Подбираем решения и оборудование, рассчитываем сроки, координируем монтаж и пусконаладку до готовности объекта.",
  },
  {
    number: "02",
    label: "Единое окно",
    title: "Сопровождаем",
    text: "Поддерживаем программный и технический контур: r_keeper, ККТ, сети, рабочие места, ГИС и электронный документооборот.",
  },
  {
    number: "03",
    label: "Интеграции",
    title: "Развиваем",
    text: "Находим причины повторяющихся проблем, создаём интеграции и дорабатываем системы под реальные процессы заведения.",
  },
] as const;

const processSteps = [
  {
    number: "01",
    label: "Обращение",
    title: "Вы описываете задачу",
    text: "В одном обращении — без поиска нужного отдела и повторного объяснения ситуации.",
  },
  {
    number: "02",
    label: "Подбор команды",
    title: "Менеджер собирает команду",
    text: "Подключает специалистов тех направлений, которые действительно нужны для решения.",
  },
  {
    number: "03",
    label: "Контроль",
    title: "Мы ведём задачу целиком",
    text: "Координируем участников, контролируем сроки и анализируем последствия решений.",
  },
  {
    number: "04",
    label: "Результат",
    title: "Вы получаете результат",
    text: "Один ответственный контур вместо нескольких несвязанных подрядчиков.",
  },
] as const;

export function AboutPage() {
  const [callbackOpen, setCallbackOpen] = useState(false);
  return <div className={styles.page} id="top">
    <SiteHeader page="about" />
    <ClosingLayout page="about">
    <main aria-label="О компании Posadmin">
      <div className={styles.content}>
      <AboutHero onContact={() => setCallbackOpen(true)} />
      <SectionReveal className={styles.stats} distance={20}>
        {[["15+", "лет автоматизируем бизнес"], ["1 000+", "запущенных объектов"], ["до 10 мин", "первичная реакция"]].map(([value, label]) => <div key={value}><strong>{value}</strong><span>{label}</span></div>)}
      </SectionReveal>
      <section id="expertise" className={styles.section} aria-labelledby="about-services-title">
        <div className={ui.sectionHeader}><SectionReveal distance={22}><p className={ui.eyebrow}>Чем мы занимаемся</p><h2 className={ui.heading} id="about-services-title">От первого запуска<br /><span className={ui.muted}>до новых возможностей</span></h2></SectionReveal><SectionReveal distance={20} delay={0.12}><p className={ui.lead}>Программное обеспечение, оборудование, кассы, ГИС и интеграции. Все направления объединены в одну команду с вашим персональным менеджером.</p></SectionReveal></div>
        <ol className={styles.outcomes}>
          {outcomes.map((item, index) => (
            <li key={item.number}>
              <SectionReveal className={styles.outcome} delay={index * 0.08} distance={22}>
                <span className={styles.outcomeNumber}>{item.number}</span>
                <div className={styles.outcomeHeading}>
                  <p>{item.label}</p>
                  <h3>{item.title}</h3>
                </div>
                <p className={styles.outcomeDescription}>{item.text}</p>
              </SectionReveal>
            </li>
          ))}
        </ol>
      </section>
      <section id="approach" className={styles.approach} aria-labelledby="about-process-title">
        <SectionReveal className={styles.approachIntro} distance={22}><p className={ui.eyebrow}>Как мы работаем</p><h2 id="about-process-title">Одна задача<br />Один диалог<br /><span>Вся команда</span></h2><p>Вам не нужно искать нужного специалиста и повторять историю обращения. Мы координируем работу внутри команды.</p><div className={styles.dialogNote}><span aria-hidden="true">↗</span>Персональный чат<br />в Telegram или MAX</div></SectionReveal>
        <ol className={styles.process}>{processSteps.map((item, index) => <li key={item.number}><SectionReveal delay={index * 0.06} distance={20}><span className={styles.processNumber}>{item.number}</span><div><p>{item.label}</p><h3>{item.title}</h3><span>{item.text}</span></div></SectionReveal></li>)}</ol>
      </section>
      <PhilosophySection />
      </div>
    </main>
    </ClosingLayout>
    <CallbackDialog open={callbackOpen} onClose={() => setCallbackOpen(false)} />
  </div>;
}
