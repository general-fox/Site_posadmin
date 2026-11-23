"use client";

import { useState } from "react";
import { CallbackDialog } from "@/components/callback-dialog";
import { SITE_PRODUCTS } from "@/lib/site-navigation";
import { SectionReveal } from "./marketing-ui";
import { FlexBonusPreview } from "./flexbonus-preview";
import { FoxControlTelegram } from "./fox-control-telegram";
import { ReZebraPreview } from "./rezebra-preview";
import { SiteLogoMark } from "./site-logo-mark";
import { UiIcon } from "./ui-icon";
import ui from "./marketing.module.css";
import styles from "./products-section.module.css";

const { rezebra, flexbonus, foxControl } = SITE_PRODUCTS;

export function ProductsSection() {
  const [callbackOpen, setCallbackOpen] = useState(false);

  return <section aria-labelledby="products-title" className={`${ui.section} ${styles.section} section-atmosphere-host`} id="products">
    <div className={ui.shell}>
      <div className={ui.sectionHeader}>
        <SectionReveal distance={22}>
          <p className={ui.eyebrow}>Продукты для вашего заведения</p>
          <h2 className={ui.heading} id="products-title">
            Сделано в <SiteLogoMark className={styles.headingLogo} withDot /><span className="sr-only">Posadmin</span>
          </h2>
        </SectionReveal>
      </div>
      <div className={styles.productGrid}>
        <div id="rezebra" className={styles.productAnchor}>
          <SectionReveal className={`${styles.productCard} ${styles.tabletCard}`} distance={24}>
            <div className={styles.productCopy}>
              <p className={styles.category}>{rezebra.category}</p>
              <h3>{rezebra.name}</h3>
              <p className={styles.description}>Ведите бронирования и рассаживайте гостей на плане зала. Хостес сразу видит, какие столы свободны и когда придут следующие гости.</p>
              <a href="https://rezebra.ru/" target="_blank" rel="noreferrer" className={ui.primary}>На сайт {rezebra.name} <UiIcon name="arrow-up-right" /></a>
            </div>
            <div className={styles.productVisual}>
              <ReZebraPreview />
            </div>
          </SectionReveal>
        </div>
        <div id="flexbonusb" className={styles.productAnchor}>
          <SectionReveal className={`${styles.productCard} ${styles.tabletCard}`} delay={0.1} distance={24}>
            <div className={styles.productCopy}>
              <p className={styles.category}>{flexbonus.category}</p>
              <h3>{flexbonus.name}</h3>
              <p className={styles.description}>Предлагайте гостям бонусы, скидки и сертификаты. В дашборде видно, как часто гости возвращаются и сколько тратят.</p>
              <button type="button" className={ui.primary} onClick={() => setCallbackOpen(true)}>Узнать о подключении <UiIcon name="arrow-right" /></button>
            </div>
            <div className={styles.productVisual}>
              <FlexBonusPreview />
            </div>
          </SectionReveal>
        </div>
        <div id="foxcontrol" className={styles.productAnchor}>
          <SectionReveal className={`${styles.productCard} ${styles.tabletCard} ${styles.foxCard}`} distance={24}>
            <div className={styles.productCopy}>
              <p className={styles.category}>{foxControl.category}</p>
              <h3>{foxControl.name}</h3>
              <p className={styles.description}>Получайте в Telegram уведомления об удалениях, скидках и переносах в r_keeper. Ежедневные отчёты по сменам доступны для одного ресторана и всей сети.</p>
              <div className={styles.productActions}>
                <a href="https://foxcontrol.ru/" target="_blank" rel="noopener noreferrer" className={ui.primary} aria-label="На сайт Fox Control, откроется в новой вкладке">На сайт Fox Control <UiIcon name="arrow-up-right" /></a>
                <a
                  href="/products/fox-control-daily-report-example.pdf"
                  download="Fox-Control-ежедневный-отчёт.pdf"
                  type="application/pdf"
                  className={ui.secondary}
                  aria-label="Скачать пример ежедневного отчёта Fox Control в PDF"
                >
                  Скачать пример отчёта <UiIcon name="download" />
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
