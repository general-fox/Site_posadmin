"use client";

import { useEffect, useRef, useState } from "react";
import { CallbackDialog } from "@/components/callback-dialog";
import { SITE_PRODUCTS } from "@/lib/site-navigation";
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
  const stackRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const stack = stackRef.current;
    const heading = headingRef.current;
    if (!stack || !heading) return;
    const cards = cardRefs.current.filter((card): card is HTMLElement => card !== null);
    const measure = () => {
      // Only sizes are observed: scrolling and browser-toolbar movement never
      // drive React state or change the native sticky layout mode.
      const headingHeight = `${Math.ceil(heading.getBoundingClientRect().height)}px`;
      if (stack.style.getPropertyValue("--product-heading-height") !== headingHeight) {
        stack.style.setProperty("--product-heading-height", headingHeight);
      }
      cards.forEach((card) => {
        const height = `${Math.ceil(card.getBoundingClientRect().height)}px`;
        if (card.style.getPropertyValue("--product-measured-height") !== height) {
          card.style.setProperty("--product-measured-height", height);
        }
      });
    };
    measure();
    if (typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(measure);
    observer.observe(heading);
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return <section aria-labelledby="products-title" className={`${ui.section} ${styles.section} section-atmosphere-host`} id="products">
    <div ref={stackRef} className={`${ui.shell} ${styles.productStack}`}>
      <header ref={headingRef} className={styles.productHeading}>
        <p className={ui.eyebrow}>Продукты для вашего заведения</p>
        <h2 className={ui.heading} id="products-title">
          Сделано в <SiteLogoMark className={styles.headingLogo} withDot /><span className="sr-only">Posadmin</span>
        </h2>
      </header>
      <span id="rezebra" className={styles.productTarget} data-anchor-heading="rezebra-title" aria-hidden="true" />
      <article ref={(card) => { cardRefs.current[0] = card; }} className={`${styles.productCard} ${styles.tabletCard}`} aria-labelledby="rezebra-title">
        <div className={styles.productCopy}>
          <p className={styles.category}>{rezebra.category}</p>
          <h3 id="rezebra-title">{rezebra.name}</h3>
          <p className={styles.description}>Ведите бронирования и рассаживайте гостей на плане зала. Хостес сразу видит, какие столы свободны и когда придут следующие гости.</p>
          <a href="https://rezebra.ru/" target="_blank" rel="noreferrer" className={ui.primary}>На сайт {rezebra.name} <UiIcon name="arrow-up-right" /></a>
        </div>
        <div className={styles.productVisual}>
          <ReZebraPreview />
        </div>
      </article>
      <span id="flexbonusb" className={`${styles.productTarget} ${styles.secondProduct}`} data-anchor-heading="flexbonusb-title" aria-hidden="true" />
      <article ref={(card) => { cardRefs.current[1] = card; }} className={`${styles.productCard} ${styles.tabletCard} ${styles.secondProduct}`} aria-labelledby="flexbonusb-title">
        <div className={styles.productCopy}>
          <p className={styles.category}>{flexbonus.category}</p>
          <h3 id="flexbonusb-title">{flexbonus.name}</h3>
          <p className={styles.description}>Предлагайте гостям бонусы, скидки и сертификаты. В дашборде видно, как часто гости возвращаются и сколько тратят.</p>
          <button type="button" className={ui.primary} onClick={() => setCallbackOpen(true)}>Узнать о подключении <UiIcon name="arrow-right" /></button>
        </div>
        <div className={styles.productVisual}>
          <FlexBonusPreview />
        </div>
      </article>
      <span id="foxcontrol" className={`${styles.productTarget} ${styles.lastProduct}`} data-anchor-heading="foxcontrol-title" aria-hidden="true" />
      <article ref={(card) => { cardRefs.current[2] = card; }} className={`${styles.productCard} ${styles.tabletCard} ${styles.foxCard} ${styles.lastProduct}`} aria-labelledby="foxcontrol-title">
        <div className={styles.productCopy}>
          <p className={styles.category}>{foxControl.category}</p>
          <h3 id="foxcontrol-title">{foxControl.name}</h3>
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
      </article>
    </div>
    <CallbackDialog onClose={() => setCallbackOpen(false)} open={callbackOpen} />
  </section>;
}
