"use client";

import Link from "next/link";
import { SupportChat } from "./support-chat";
import { ServicesTiles } from "./services-tiles";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { SectionAtmosphere } from "./section-atmosphere";
import ui from "./marketing.module.css";
import styles from "./specialists-section.module.css";

export function SpecialistsSection() {
  return <section id="about" className={`${styles.section} section-atmosphere-host`} aria-labelledby="specialists-title">
    <SectionAtmosphere />
    <div className={styles.shell}>
      <div className={styles.intro}>
        <SectionReveal distance={22}><p className={ui.eyebrow}>О нас · команда Posadmin</p><h2 id="specialists-title">Одна команда<br /><span>Все технические вопросы</span></h2></SectionReveal>
        <SectionReveal className={styles.description} distance={18} delay={0.12}><p>Вы пишете в один чат — мы подключаем нужных специалистов.</p><Link href="/about" className={ui.textLink}>Подробнее о нас <ArrowRight /></Link></SectionReveal>
      </div>
      <div className={styles.expertise}>
        <div className={styles.tiles}><ServicesTiles /></div>
        <SectionReveal className={styles.chat} distance={22} delay={0.25}><SupportChat /></SectionReveal>
      </div>
    </div>
  </section>;
}
