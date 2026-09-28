"use client";

import Link from "next/link";
import { SupportChat } from "./support-chat";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { SectionAtmosphere } from "./section-atmosphere";
import ui from "./marketing.module.css";
import styles from "./specialists-section.module.css";

export function SpecialistsSection() {
  return <section id="about" className={`${styles.section} section-atmosphere-host`} aria-labelledby="specialists-title">
    <SectionAtmosphere />
    <div className={styles.shell}>
      <div className={styles.intro}>
        <SectionReveal distance={22}><p className={ui.eyebrow}>О нас · Команда Posadmin</p><h2 id="specialists-title">Одна команда<br /><span>Все технические вопросы</span></h2></SectionReveal>
        <SectionReveal className={styles.description} distance={18} delay={0.12}><p>Берём на себя автоматизацию и сопровождение r_keeper, кассы и IT-инфраструктуру. Помогаем вашему заведению работать, а команде — заниматься гостями.</p></SectionReveal>
      </div>
      <div className={styles.expertise}>
        <div className={styles.overview}>
          <div className={styles.capabilities}>
            <SectionReveal className={styles.capability} distance={18}>
              <h3>Запустить заведение</h3>
              <p>Подобрать оборудование, настроить r_keeper, кассы и сеть. Подготовить рабочие места к первым заказам.</p>
            </SectionReveal>
            <SectionReveal className={styles.capability} distance={18} delay={0.06}>
              <h3>Поддерживать каждый день</h3>
              <p>Помочь сотрудникам, устранить сбои, обновить меню и поддерживать работу касс, оборудования и учётных систем.</p>
            </SectionReveal>
            <SectionReveal className={styles.capability} distance={18} delay={0.12}>
              <h3>Развивать систему</h3>
              <p>Связать системы и автоматизировать повторяющиеся задачи. Подключить бронирование и лояльность гостей.</p>
            </SectionReveal>
          </div>
          <SectionReveal className={styles.aboutAction} distance={14} delay={0.16}>
            <Link href="/about" className={ui.primary}>Подробнее о нас <ArrowRight /></Link>
          </SectionReveal>
        </div>
        <div className={styles.team}>
          <SectionReveal className={styles.chat} distance={22} delay={0.25}><SupportChat /></SectionReveal>
          <SectionReveal className={styles.teamNote} distance={14} delay={0.1}><p>Вы пишете в один чат — реагируют нужные специалисты.</p></SectionReveal>
        </div>
      </div>
    </div>
  </section>;
}
