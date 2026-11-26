"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { UiIcon } from "./ui-icon";
import styles from "./mobile-calculation-bar.module.css";

type MobileCalculationBarProps = {
  configurationRef: RefObject<HTMLDivElement | null>;
  summaryRef: RefObject<HTMLElement | null>;
  summaryId: string;
  productName: string;
  total: number;
  hasSelection: boolean;
  dialogOpen: boolean;
};

export function MobileCalculationBar({ configurationRef, summaryRef, summaryId, productName, total, hasSelection, dialogOpen }: MobileCalculationBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const configuration = configurationRef.current;
    const summary = summaryRef.current;
    if (!configuration || !summary) return;
    const mobile = window.matchMedia("(max-width: 900px)");
    let observer: IntersectionObserver | undefined;
    let configurationVisible = false;
    let summaryVisible = false;

    const update = () => {
      setVisible(mobile.matches && configurationVisible && !summaryVisible);
    };
    const observe = () => {
      observer?.disconnect();
      configurationVisible = false;
      summaryVisible = false;
      setVisible(false);
      if (!mobile.matches) return;
      // The header and floating total are outside the useful reading area.
      // One visible summary takes over from the floating total immediately.
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === configuration) configurationVisible = entry.isIntersecting;
          if (entry.target === summary) summaryVisible = entry.isIntersecting;
        });
        update();
      }, { rootMargin: "-96px 0px -88px 0px", threshold: 0 });
      observer.observe(configuration);
      observer.observe(summary);
    };
    observe();
    mobile.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      mobile.removeEventListener("change", observe);
    };
  }, [configurationRef, summaryRef]);

  if (!visible || dialogOpen) return null;

  // A portal keeps this control anchored to the viewport outside reveal layers.
  // The regular summary remains the accessible target.
  return createPortal(<nav className={styles.bar} data-calculation-bar="" aria-label={`Быстрый переход к расчёту ${productName}`}>
    <div className={styles.amount}>
      <span>{productName}</span>
      {hasSelection ? <p>{new Intl.NumberFormat("ru-RU").format(total)} ₽ <span>/ мес.</span></p> : <p className={styles.empty}>Выберите сопровождение</p>}
    </div>
    <a className={styles.link} href={`#${summaryId}`} aria-label={`Посмотреть итог расчёта ${productName}`} data-button-reveal="">
      <span>К расчёту</span>
      <UiIcon name="chevron-down" />
    </a>
  </nav>, document.body);
}
