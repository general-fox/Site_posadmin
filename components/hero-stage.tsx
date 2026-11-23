"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { PointerEvent } from "react";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import { HeroActions } from "./hero-actions";
import styles from "./hero-stage.module.css";

const products = [
  ["rezebra", "ReZebra", "Бронирования, столы и загрузка зала"],
  ["flexbonusb", "FlexBonus", "Бонусы, скидки и лояльность гостей"],
  ["foxcontrol", "Fox Control", "Контроль кассовых операций"],
] as const;
const systems = ["r_keeper", "1С", "ЕГАИС", "ККТ", "Честный знак", "Меркурий", "IT-инфраструктура"];
const ease = [0.22, 1, 0.36, 1] as const;
const ProductLink = motion.create(Link);

export function GlowLayer() {
  return <div className="hero-glow-board pointer-events-none absolute inset-0" aria-hidden="true" />;
}

function HeroProducts({ reduced }: { reduced: boolean }) {
  function moveGlow(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType === "touch") return;
    const panel = event.currentTarget;
    const { left, top } = panel.getBoundingClientRect();
    panel.style.setProperty("--glow-x", `${event.clientX - left}px`);
    panel.style.setProperty("--glow-y", `${event.clientY - top}px`);
  }

  return <motion.div
    className={styles.visual}
    aria-label="Собственные продукты Posadmin"
    initial={reduced ? false : { opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={reduced ? { duration: 0 } : { duration: .7, delay: .35, ease }}
    onPointerEnter={moveGlow}
    onPointerMove={moveGlow}
  >
    <noscript><style>{`.${styles.visual}, .${styles.area} { opacity: 1 !important; transform: none !important; }`}</style></noscript>
    <div className={styles.visualHeader}><h2>Наши продукты</h2><span>Развиваем сами</span></div>
    <div className={styles.areas}>{products.map(([id, title, description], index) =>
      <ProductLink
        key={id}
        href={`/#${id}`}
        className={styles.area}
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: .55, delay: .45 + index * .08, ease }}
      >
        <div className={styles.areaHeader}><h3>{title}</h3><span className={styles.productArrow} aria-hidden="true">↗</span></div>
        <p>{description}</p>
      </ProductLink>
    )}</div>
    <div className={styles.visualBottom}><span>Одна команда для ваших систем</span><Link href="/#pricing" className={styles.visualFooter}>Техподдержка 24/7 <span aria-hidden="true">↗</span></Link></div>
  </motion.div>;
}

export function HeroStage() {
  const reduced = useHydratedReducedMotion();
  return <div className={styles.hero}>
    <div className={styles.copy}>
      <motion.p className={styles.eyebrow} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .1 }}>Posadmin · автоматизация HoReCa</motion.p>
      <h1 className={styles.title}>
        <span className={styles.line}><motion.span initial={reduced ? false : { y: "105%" }} animate={{ y: 0 }} transition={{ duration: reduced ? 0 : .85, delay: .15, ease }}>Автоматизация и поддержка ресторанов 24/7</motion.span></span>
      </h1>
      <motion.p className={styles.lead} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, delay: .3, ease }}>Разрабатываем решения для вашего заведения и берём на себя технический контур — от касс до IT-инфраструктуры.</motion.p>
      <HeroActions reduced={reduced} />
      <ul className={styles.systems} role="list" aria-label="Направления работы">
        {systems.map((name, i) => <motion.li key={name} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .45, delay: .65 + i * .035, ease }}>{name}</motion.li>)}
      </ul>
      <p className={styles.dealer}>Официальный дилер r_keeper</p>
    </div>

    <HeroProducts reduced={reduced} />
  </div>;
}
