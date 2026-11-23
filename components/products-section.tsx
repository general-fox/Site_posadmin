"use client";

import { useState } from "react";
import { CallbackDialog } from "@/components/callback-dialog";
import { ArrowRight, SectionReveal } from "./marketing-ui";
import { FlexBonusPreview } from "./flexbonus-preview";
import { FoxControlTelegram } from "./fox-control-telegram";
import { ReZebraPreview } from "./rezebra-preview";
import ui from "./marketing.module.css";
import styles from "./products-section.module.css";

export function ProductsSection() {
  const [callbackOpen, setCallbackOpen] = useState(false);

  return <section aria-labelledby="products-title" className={`${ui.section} ${styles.section} section-atmosphere-host`} id="products">
    <div className={ui.shell}>
      <div className={ui.sectionHeader}>
        <SectionReveal distance={22}><p className={ui.eyebrow}>Продукты для вашего заведения</p><h2 className={ui.heading} id="products-title">Больше внимания<br /><span className={ui.muted}>вашим гостям</span></h2></SectionReveal>
      </div>
      <div className={styles.productGrid}>
        <div id="rezebra" className={styles.productAnchor}>
          <SectionReveal className={`${styles.productCard} ${styles.tabletCard}`} distance={24}>
            <div className={styles.productCopy}>
              <p className={styles.category}>Бронирование</p>
              <h3>ReZebra</h3>
              <p className={styles.description}>Ведите бронирования и рассаживайте гостей на плане зала. Хостес сразу видит, какие столы свободны и когда придут следующие гости.</p>
              <a href="https://rezebra.ru/" target="_blank" rel="noreferrer" className={ui.primary}>На сайт ReZebra <ArrowRight diagonal /></a>
            </div>
            <div className={styles.productVisual}>
              <ReZebraPreview />
            </div>
          </SectionReveal>
        </div>
        <div id="flexbonusb" className={styles.productAnchor}>
          <SectionReveal className={`${styles.productCard} ${styles.tabletCard}`} delay={0.1} distance={24}>
            <div className={styles.productCopy}>
              <p className={styles.category}>Лояльность</p>
              <h3>FlexBonus</h3>
              <p className={styles.description}>Предлагайте гостям бонусы, скидки и сертификаты. В дашборде видно, как часто гости возвращаются и сколько тратят.</p>
              <button type="button" className={ui.primary} onClick={() => setCallbackOpen(true)}>Узнать о подключении <ArrowRight /></button>
            </div>
            <div className={styles.productVisual}>
              <FlexBonusPreview />
            </div>
          </SectionReveal>
        </div>
        <div id="foxcontrol" className={styles.productAnchor}>
          <SectionReveal className={`${styles.productCard} ${styles.tabletCard} ${styles.foxCard}`} distance={24}>
            <div className={styles.productCopy}>
              <p className={styles.category}>Контроль операций в r_keeper</p>
              <h3>Fox Control</h3>
              <p className={styles.description}>Получайте в Telegram уведомления об удалениях, скидках и переносах. Ежедневные отчёты по сменам доступны для одного ресторана и всей сети.</p>
              <div className={styles.productActions}>
                <a href="https://foxcontrol.ru/" target="_blank" rel="noopener noreferrer" className={ui.primary} aria-label="На сайт Fox Control, откроется в новой вкладке">На сайт Fox Control <ArrowRight diagonal /></a>
                <a
                  href="/products/fox-control-daily-report-example.pdf"
                  download="Fox-Control-ежедневный-отчёт.pdf"
                  type="application/pdf"
                  className={ui.secondary}
                  aria-label="Скачать пример ежедневного отчёта Fox Control в PDF"
                >
                  Скачать пример отчёта <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
            <div className={styles.productVisual}>
              <FoxControlTelegram />
            </div>
          </SectionReveal>
        </div>
      </div>
    </div>
    <CallbackDialog onClose={() => setCallbackOpen(false)} open={callbackOpen} />
  </section>;
}
