"use client";

import { ClientsStatsDots } from "@/components/clients-stats-dots";
import Image from "next/image";
import Link from "next/link";
import { SectionReveal, useScrollReveal } from "./marketing-ui";
import ui from "./marketing.module.css";

const CLIENTS = [
  { name: "Avrora", src: "/clients/avrora.svg", href: "https://avrora.rest/" },
  { name: "Afina", src: "/clients/afina.svg", href: "https://afina.rest/" },
  { name: "Loona", src: "/clients/loona.svg", href: "https://loona.rest/" },
  { name: "Phantom", src: "/clients/phantom.svg", href: "https://phantom.rest/" },
  { name: "Patriki", src: "/clients/patriki.svg", href: "https://patriki.rest/" },
  { name: "Stars Coffee", src: "/clients/stars.svg", href: "https://stars-coffee.ru/" },
  { name: "Ava", src: "/clients/ava.svg", href: "https://ava.rest/" },
  { name: "Магадан", src: "/clients/magadan.svg", href: "https://magadanrest.ru/" },
  { name: "Колбасный цех", src: "/clients/kc.svg", href: "https://kolbasnyy-tsekh.ru/" },
  { name: "Сыроварня", src: "/clients/sirovarnya.svg", href: "https://www.syrovarnya.com/" },
] as const;

export function ClientsSection() {
  const logoGridRef = useScrollReveal<HTMLDivElement>({ distance: 12, rows: true });
  return (
    <section className="clients-section font-[family-name:var(--font-inter)]" aria-labelledby="clients-title" data-header-surface="dark">
      <div className="clients-inner">
        <div className={`${ui.sectionHeader} clients-heading`}>
          <SectionReveal distance={22}>
            <p className={ui.eyebrow}>Наши клиенты</p>
            <h2 className={ui.heading} id="clients-title">Нас выбирают<br /><span className={ui.muted}>сильные команды</span></h2>
          </SectionReveal>
          <SectionReveal distance={18} delay={0.12}><p className={ui.lead}>С этими заведениями мы давно работаем на постоянной основе. Помогаем решать технические задачи, чтобы их команды могли сосредоточиться на гостях.</p></SectionReveal>
        </div>
        <p className="clients-link-hint">Логотипы ведут на сайты заведений <span aria-hidden="true">↗</span></p>
        <div className="clients-layout" data-header-surface="light">
          <div ref={logoGridRef} className="clients-grid" data-scroll-reveal="">
            {CLIENTS.map((client) => (
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
          <SectionReveal className="clients-stats-card" distance={22} delay={0.12}>
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
          <Link href="/about#approach">Как устроена работа <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6" /></svg></Link>
        </div>
      </div>
    </section>
  );
}
