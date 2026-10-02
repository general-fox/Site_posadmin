"use client";

import Link from "next/link";
import { useState, type PointerEvent } from "react";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { SiteLogoMark } from "./site-logo-mark";
import ui from "./marketing.module.css";
import styles from "./about-hero.module.css";

export function AboutHero({ onContact }: { onContact: () => void }) {
  const [lastHoveredCard, setLastHoveredCard] = useState(1);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  const activeCard = focusedCard ?? lastHoveredCard;

  function highlightCard(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch" || !window.matchMedia(
      "(min-width: 768px) and (hover: hover) and (pointer: fine)",
    ).matches) {
      return;
    }

    // Fixed thirds keep hit areas stable while the cards change their visual size.
    const bounds = event.currentTarget.getBoundingClientRect();
    const index = Math.min(2, Math.max(0, Math.floor(
      (event.clientX - bounds.left) / bounds.width * 3,
    )));
    setLastHoveredCard(index);
  }

  return (
    <section className={styles.hero} aria-labelledby="about-title" data-about-hero>
      <Link href="/" className={styles.backLink}><span aria-hidden="true">←</span> На главную</Link>
      <SectionReveal className={styles.copy} distance={16}>
        <p className={ui.eyebrow}>Posadmin · о компании</p>
        <h1 id="about-title">Вся команда<br /><span>на вашей стороне</span></h1>
        <p className={styles.lead}>Автоматизируем ресторанный бизнес — от первого запуска<br className={styles.desktopBreak} /> до ежедневной поддержки. Все технические задачи в одних руках.</p>
        <div className={styles.actions}>
          <button type="button" className={ui.primary} onClick={onContact}>Обсудить проект <ArrowRight /></button>
          <a href="#approach" className={ui.textLink}>Как мы работаем <span aria-hidden="true">↓</span></a>
        </div>
      </SectionReveal>

      <div className={styles.workspace} role="group" aria-label="Как команда Posadmin ведёт вашу задачу">
        <div className={styles.workspaceHeader}>
          <span className={styles.brand}><SiteLogoMark /> <span>Единая команда</span></span>
          <span className={styles.workspaceNote}>От обращения — к результату</span>
        </div>
        <div
          className={styles.board}
          data-active-card={activeCard}
          onPointerEnter={highlightCard}
          onPointerMove={highlightCard}
          onFocusCapture={(event) => {
            const index = Array.from(event.currentTarget.children).findIndex(
              (card) => card.contains(event.target),
            );
            setFocusedCard(index < 0 ? null : index);
          }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocusedCard(null);
          }}
        >
          <SectionReveal className={`${styles.column} ${activeCard === 0 ? styles.active : ""}`} delay={0.04} distance={0}>
            <div className={styles.columnHeader}><span className={styles.statusDot} />Ваша задача<span className={styles.step}>01</span></div>
            <div className={styles.task}>
              <span className={styles.taskLabel}>Новый проект</span>
              <h2>Открываем ресторан</h2>
              <p>Нужно подготовить всё<br /> к первому гостю</p>
              <div className={styles.taskFooter}><span className={styles.avatar}>Вы</span><span>Один диалог с командой</span></div>
            </div>
            <div className={styles.note}><span aria-hidden="true">↗</span> Запуск, поддержка или развитие</div>
          </SectionReveal>

          <SectionReveal className={`${styles.column} ${activeCard === 1 ? styles.active : ""}`} delay={0.1} distance={0}>
            <div className={styles.columnHeader}><span className={styles.statusDot} />Наша команда<span className={styles.step}>02</span></div>
            <div className={styles.task}>
              <span className={styles.taskLabel}>Менеджер координирует работу</span>
              <h2>Подключаем специалистов</h2>
              <ul className={styles.checklist}>
                <li><span aria-hidden="true">✓</span>Кассы и r_keeper</li>
                <li><span aria-hidden="true">✓</span>Оборудование и сеть</li>
                <li><span aria-hidden="true">✓</span>ГИС и интеграции</li>
              </ul>
              <div className={styles.teamFooter}><span className={styles.teamAvatars} aria-hidden="true"><i>М</i><i>И</i><i>IT</i></span><span>Разные компетенции<br /><strong>Общая ответственность</strong></span></div>
            </div>
          </SectionReveal>

          <SectionReveal className={`${styles.column} ${activeCard === 2 ? styles.active : ""}`} delay={0.14} distance={0}>
            <div className={styles.columnHeader}><span className={styles.statusDot} />Ваш результат<span className={styles.step}>03</span></div>
            <div className={styles.task}>
              <span className={styles.taskLabel}>Всё связано и настроено</span>
              <h2>Можно встречать гостей</h2>
              <p>Технологии работают.<br /> Вы занимаетесь своим делом.</p>
              <div className={styles.ready}><span aria-hidden="true">✓</span> Готовы к работе</div>
            </div>
            <div className={styles.support}><span className={styles.supportDot} /><span>И после запуска — рядом</span><strong>24/7</strong></div>
          </SectionReveal>
        </div>
      </div>
    </section>
  );
}
