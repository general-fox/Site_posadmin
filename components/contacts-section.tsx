"use client";

import { useState } from "react";
import { SITE_CONTACTS } from "@/lib/site-contacts";
import { CallbackDialog } from "./callback-dialog";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import ui from "./marketing.module.css";
import styles from "./contacts-section.module.css";

export function ContactsSection({ flushTop = false }: { flushTop?: boolean }) {
  const [callbackOpen, setCallbackOpen] = useState(false);

  return (
    <section
      id="contact"
      data-header-surface="dark"
      aria-labelledby="contacts-title"
      className={`${ui.section} ${styles.section}${flushTop ? ` ${styles.flushTop}` : ""}`}
    >
      <div className={styles.glow} aria-hidden="true" />
      <div className={`${ui.shell} ${styles.content}`}>
        <div className={ui.sectionHeader}>
          <SectionReveal>
            <p className={`${ui.eyebrow} ${styles.eyebrow}`}>Контакты</p>
            <h2 id="contacts-title" className={ui.heading}>
              Давайте найдём<br /><span className={styles.muted}>решение</span>
            </h2>
          </SectionReveal>
          <SectionReveal delay={0.08}>
            <p className={`${ui.lead} ${styles.lead}`}>
              Расскажите о своей задаче — поможем с запуском,
              сопровождением или развитием вашего бизнеса.
            </p>
          </SectionReveal>
        </div>

        <div className={styles.grid}>
          <SectionReveal className={styles.direct} distance={16}>
            <div>
              <h3 className={styles.label}>Связаться с командой</h3>
              <a className={styles.phone} href={SITE_CONTACTS.phoneHref}>
                {SITE_CONTACTS.phone}
              </a>
              <p className={styles.hours}>
                Менеджер на связи<br />{SITE_CONTACTS.managerHours}
              </p>
            </div>
            <div className={styles.actions}>
              <a
                className={`${ui.primary} ${styles.telegram}`}
                href={SITE_CONTACTS.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Написать менеджеру в Telegram"
              >
                Написать менеджеру <ArrowRight diagonal />
              </a>
              <span className={styles.channel}>В Telegram — через бота Posadmin</span>
              <button type="button" className={ui.textLink} onClick={() => setCallbackOpen(true)}>
                Заказать звонок <ArrowRight />
              </button>
            </div>
          </SectionReveal>

          <div className={styles.offices}>
            {SITE_CONTACTS.offices.map((office, index) => (
              <SectionReveal key={office.city} className={styles.office} delay={index * 0.07}>
                <div className={styles.officeTop}>
                  <span className={styles.label}>{office.region}</span>
                  <span className={styles.officeNumber} aria-hidden="true">0{index + 1}</span>
                </div>
                <h3 id={`office-${index + 1}`}>{office.city}</h3>
                <address>{office.street}</address>
                <a
                  className={ui.textLink}
                  href={`https://yandex.ru/maps/?text=${encodeURIComponent(office.mapQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${office.city}: открыть адрес на Яндекс Картах`}
                >
                  Открыть на карте <ArrowRight diagonal />
                </a>
              </SectionReveal>
            ))}
          </div>
        </div>
      </div>
      <CallbackDialog open={callbackOpen} onClose={() => setCallbackOpen(false)} />
    </section>
  );
}
