"use client";

import Link from "next/link";
import { useEffect, useRef, type PointerEvent } from "react";
import { SITE_PRODUCTS } from "@/lib/site-navigation";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import { HeroActions } from "./hero-actions";
import { UiIcon } from "./ui-icon";
import styles from "./hero-stage.module.css";
import entry from "./hero-entrance.module.css";

const products = [
  { id: "rezebra", ...SITE_PRODUCTS.rezebra, description: "Бронирования, столы и загрузка зала" },
  { id: "flexbonusb", ...SITE_PRODUCTS.flexbonus, description: "Бонусы, скидки и лояльность гостей" },
  { id: "foxcontrol", ...SITE_PRODUCTS.foxControl, description: "Контроль кассовых операций" },
] as const;
const systems = ["r_keeper", "1С", "ЕГАИС", "ККТ", "Честный знак", "Меркурий", "IT-инфраструктура"];

export function GlowLayer() {
  return <div className="hero-glow-board pointer-events-none absolute inset-0" aria-hidden="true" />;
}

function HeroProducts() {
  const reduced = useHydratedReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const touchMotion = window.matchMedia("(hover: none) and (pointer: coarse) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, bottom, height } = panel.getBoundingClientRect();
      const viewport = window.innerHeight;
      if (bottom <= 0 || top >= viewport) return;

      const phase = ((viewport - top) / (viewport + height)) * Math.PI * 2;
      const x = Math.sin(phase * 2.1) * 10 + Math.sin(phase * 4) * 3;
      const y = Math.sin(phase * 1.3) * 9 + Math.sin(phase * 3 + 1) * 4;
      panel.style.setProperty("--glow-scroll-x", `${x}%`);
      panel.style.setProperty("--glow-scroll-y", `${y}%`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const stop = () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const sync = () => {
      stop();
      if (!touchMotion.matches) return;
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      schedule();
    };

    sync();
    touchMotion.addEventListener("change", sync);
    return () => {
      touchMotion.removeEventListener("change", sync);
      stop();
    };
  }, []);

  function moveGlow(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType === "touch") return;
    const panel = event.currentTarget;
    const { left, top } = panel.getBoundingClientRect();
    panel.style.setProperty("--glow-x", `${event.clientX - left}px`);
    panel.style.setProperty("--glow-y", `${event.clientY - top}px`);
  }

  return <div
    ref={panelRef}
    className={`${styles.visual} ${entry.visual}`}
    aria-label="Собственные продукты Posadmin"
    onPointerEnter={moveGlow}
    onPointerMove={moveGlow}
  >
    <div className={styles.visualHeader}><h2>Наши продукты</h2><span>Развиваем сами</span></div>
    <div className={styles.areas}>{products.map(({ id, name, category, description }, index) =>
      <Link
        key={id}
        href={`/#${id}`}
        className={`${styles.area} ${entry.product}`}
        style={{ animationDelay: `${450 + index * 80}ms` }}
      >
        <div className={styles.areaHeader}>
          <span className={styles.areaCategory}>{category}</span>
          <h3>{name}</h3>
          <span className={styles.productArrow}><UiIcon name="arrow-up-right" size={16} /></span>
        </div>
        <p>{description}</p>
      </Link>
    )}</div>
    <div className={styles.visualBottom}><span>Одна команда для ваших систем</span><Link href="/#pricing" className={styles.visualFooter}>Техподдержка 24/7 <UiIcon name="arrow-up-right" size={14} /></Link></div>
  </div>;
}

export function HeroStage() {
  return <div className={styles.hero}>
    <div className={styles.copy}>
      <h1 className={styles.title}>
        <span className={styles.line}><span className={entry.title}>Автоматизация и <span className={styles.unbroken}>IT-сопровождение</span> HoReCa</span></span>
      </h1>
      <p className={`${styles.lead} ${entry.lead}`}>Разрабатываем решения для вашего заведения и берём на себя технический контур — от касс до IT-инфраструктуры.</p>
      <HeroActions />
      <ul className={styles.systems} role="list" aria-label="Направления работы">
        {systems.map((name, i) => <li key={name} className={entry.system} style={{ animationDelay: `${650 + i * 35}ms` }}>{name}</li>)}
      </ul>
      <a className={styles.dealer} href="https://rkeeper.ru/dealers/" target="_blank" rel="noopener noreferrer">
        Официальный дилер r_keeper <UiIcon name="arrow-up-right" size={14} />
        <span className="sr-only">, откроется в новой вкладке</span>
      </a>
    </div>

    <HeroProducts />
  </div>;
}
