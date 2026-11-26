"use client";

import { ClientsStatsDots } from "@/components/clients-stats-dots";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { SITE_CLIENTS } from "@/lib/site-clients";
import { SectionReveal, useScrollReveal } from "./marketing-ui";
import { UiIcon } from "./ui-icon";
import ui from "./marketing.module.css";

export function ClientsSection() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const logoGridRef = useScrollReveal<HTMLDivElement>({ rows: true, blur: false, after: descriptionRef });
  return (
    <section className="clients-section font-[family-name:var(--font-inter)]" aria-labelledby="clients-title" data-header-surface="dark">
      <div className="clients-inner">
        <div className={`${ui.sectionHeader} clients-heading`}>
          <SectionReveal>
            <p className={ui.eyebrow}>Наши клиенты</p>
            <h2 className={ui.heading} id="clients-title" ref={headingRef}>Нас выбирают<br /><span className={ui.muted}>сильные команды</span></h2>
          </SectionReveal>
          <SectionReveal after={headingRef}><p className={ui.lead} ref={descriptionRef}>С этими заведениями мы давно работаем на постоянной основе. Помогаем решать технические задачи, чтобы их команды могли сосредоточиться на гостях.</p></SectionReveal>
        </div>
        <SectionReveal after={descriptionRef} blur={false}><p className="clients-link-hint">Логотипы ведут на сайты заведений <UiIcon name="arrow-up-right" size={14} /></p></SectionReveal>
        <div className="clients-layout" data-header-surface="light">
          <div ref={logoGridRef} className="clients-grid" data-scroll-reveal="">
            {SITE_CLIENTS.map((client) => (
              <a
                className="client-logo-card"
                key={client.name}
                href={client.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${client.name} — сайт клиента (откроется в новой вкладке)`}
              >
                <svg className="client-external-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg>
                <span className="client-logo-mark">
                  <Image
                    src={client.src}
                    alt={client.name}
                    fill
                    sizes="(max-width: 639px) 30vw, (max-width: 1050px) 12vw, 105px"
                  />
                </span>
              </a>
            ))}
          </div>
          <SectionReveal className="clients-stats-card" motion="lift" blur={false} after={descriptionRef} delay={0.09}>
            <ClientsStatsDots />
            <div className="clients-stat-block clients-stat-block-top">
              <p className="clients-stat-value">Более 15 лет</p>
              <p className="clients-stat-caption">на рынке</p>
            </div>
            <div className="clients-stat-block clients-stat-block-bottom">
              <p className="clients-stat-value">1 000 +</p>
              <p className="clients-stat-caption">запущенных объектов</p>
            </div>
          </SectionReveal>
        </div>
        <div className="clients-next-step">
          <p>Долгосрочное сотрудничество. Поддержка в ежедневной работе.</p>
          <Link href="/#about-approach">Как устроена работа <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg></Link>
        </div>
      </div>
    </section>
  );
}
