"use client";

import type { ReactNode } from "react";
import { RevealWords, useScrollReveal } from "./marketing-ui";
import styles from "./service-pages.module.css";

export function ContactPageIntro({ breadcrumbs, actions }: { breadcrumbs: ReactNode; actions: ReactNode }) {
  const eyebrowRef = useScrollReveal<HTMLParagraphElement>({ animateOnMount: true });
  const headingRef = useScrollReveal<HTMLHeadingElement>({ after: eyebrowRef, animateOnMount: true });
  const leadRef = useScrollReveal<HTMLParagraphElement>({ after: headingRef, animateOnMount: true });
  const actionsRef = useScrollReveal<HTMLDivElement>({ motion: "lift", sequence: true, blur: false, after: leadRef, animateOnMount: true });

  return <header className={styles.intro} data-shared-reveal="">
    {breadcrumbs}
    <p className={styles.eyebrow} ref={eyebrowRef} data-scroll-reveal="" data-reveal-on-load="">На связи с вашим заведением</p>
    <h1 className={styles.title} ref={headingRef} data-scroll-reveal="" data-reveal-on-load=""><RevealWords>Контакты Posadmin</RevealWords></h1>
    <p className={styles.lead} ref={leadRef} data-scroll-reveal="" data-reveal-on-load="">Обсудим запуск, сопровождение или развитие вашей системы. Наши офисы находятся в Люберцах и Новороссийске, а техническая поддержка работает 24/7.</p>
    <div className={styles.actions} ref={actionsRef} data-scroll-reveal="" data-reveal-on-load="">{actions}</div>
  </header>;
}
