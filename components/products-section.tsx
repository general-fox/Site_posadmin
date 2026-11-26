"use client";

import { useEffect, useRef, useState } from "react";
import { CallbackDialog } from "@/components/callback-dialog";
import { SITE_PRODUCTS } from "@/lib/site-navigation";
import { FlexBonusPreview } from "./flexbonus-preview";
import { FoxControlTelegram } from "./fox-control-telegram";
import { ReZebraPreview } from "./rezebra-preview";
import { SiteLogoMark } from "./site-logo-mark";
import { SectionReveal } from "./marketing-ui";
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
    const lastCard = cards.at(-1);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visibilityFrame = 0;
    let fadeEnd = 0;
    let stickyHeading = false;
    const updateHeadingVisibility = () => {
      visibilityFrame = 0;
      // Finish fading before the final card reaches the heading. Only opacity
      // changes: the native sticky geometry and opaque card surfaces stay put.
      const progress = stickyHeading && lastCard
        ? Math.max(0, Math.min(1, (lastCard.getBoundingClientRect().top - fadeEnd) / 100))
        : 1;
      const opacity = (progress * progress * (3 - 2 * progress)).toFixed(3);
      if (heading.style.getPropertyValue("--product-heading-opacity") !== opacity) {
        heading.style.setProperty("--product-heading-opacity", opacity);
      }
    };
    const queueHeadingVisibility = () => {
      if (!visibilityFrame) visibilityFrame = requestAnimationFrame(updateHeadingVisibility);
    };
    const measure = () => {
      // Only sizes are observed: scrolling and browser-toolbar movement never
      // drive React state or change the native sticky layout mode.
      const measuredHeadingHeight = Math.ceil(heading.getBoundingClientRect().height);
      const headingHeight = `${measuredHeadingHeight}px`;
      const headingStyle = getComputedStyle(heading);
      stickyHeading = headingStyle.position === "sticky" && !reducedMotion.matches;
      const gap = parseFloat(headingStyle.getPropertyValue("--product-gap")) || 0;
      const lastOffset = (parseFloat(headingStyle.getPropertyValue("--product-stack-step")) || 0) * (cards.length - 1);
      fadeEnd = (parseFloat(headingStyle.top) || 0) + measuredHeadingHeight + gap + lastOffset;
      if (stack.style.getPropertyValue("--product-heading-height") !== headingHeight) {
        stack.style.setProperty("--product-heading-height", headingHeight);
      }
      cards.forEach((card) => {
        const height = `${Math.ceil(card.getBoundingClientRect().height)}px`;
        if (card.style.getPropertyValue("--product-measured-height") !== height) {
          card.style.setProperty("--product-measured-height", height);
        }
      });
      queueHeadingVisibility();
    };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(heading);
    cards.forEach((card) => observer?.observe(card));
    window.addEventListener("scroll", queueHeadingVisibility, { passive: true });
    window.addEventListener("resize", measure);
    reducedMotion.addEventListener("change", measure);
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(visibilityFrame);
      window.removeEventListener("scroll", queueHeadingVisibility);
      window.removeEventListener("resize", measure);
      reducedMotion.removeEventListener("change", measure);
      heading.style.removeProperty("--product-heading-opacity");
    };
  }, []);

  return <section aria-labelledby="products-title" className={`${ui.section} ${styles.section} section-atmosphere-host`} id="products">
    <div ref={stackRef} className={`${ui.shell} ${styles.productStack}`}>
      <header ref={headingRef} className={styles.productHeading}>
        <SectionReveal>
          <p className={ui.eyebrow}>Продукты для вашего заведения</p>
          <h2 className={ui.heading} id="products-title">
            Сделано в <span data-reveal-word=""><SiteLogoMark className={styles.headingLogo} withDot /><span className="sr-only">Posadmin</span></span>
          </h2>
        </SectionReveal>
      </header>
      <span id="rezebra" className={styles.productTarget} data-anchor-heading="rezebra-title" aria-hidden="true" />
      <article ref={(card) => { cardRefs.current[0] = card; }} className={`${styles.productCard} ${styles.tabletCard}`} aria-labelledby="rezebra-title">
        <div className={styles.productCopy}>
          <p className={styles.category}>{rezebra.category}</p>
          <h3 id="rezebra-title">{rezebra.name}</h3>
          <p className={styles.description}>Ведите бронирования и рассаживайте гостей на плане зала. Хостес сразу видит, какие столы свободны и когда придут следующие гости.</p>
          <a href="https://rezebra.ru/" target="_blank" rel="noreferrer" className={ui.primary} data-button-reveal="">На сайт {rezebra.name} <UiIcon name="arrow-up-right" /></a>
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
      <article ref={(card) => { cardRefs.current[2] = card; }} className={`${styles.productCard} ${styles.tabletCard} ${styles.lastProduct}`} aria-labelledby="foxcontrol-title">
        <div className={styles.productCopy}>
          <p className={styles.category}>{foxControl.category}</p>
          <h3 id="foxcontrol-title">{foxControl.name}</h3>
          <p className={styles.description}>Получайте в Telegram уведомления об удалениях, скидках и переносах в r_keeper. Ежедневные отчёты по сменам доступны для одного ресторана и всей сети.</p>
          <div className={styles.productActions}>
            <a href="https://foxcontrol.ru/" target="_blank" rel="noopener noreferrer" className={ui.primary} aria-label="На сайт Fox Control, откроется в новой вкладке" data-button-reveal="">На сайт Fox Control <UiIcon name="arrow-up-right" /></a>
            <a
              data-button-reveal=""
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
