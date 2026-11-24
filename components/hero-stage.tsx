"use client";

import Link from "next/link";
import type { CSSProperties, PointerEvent } from "react";
import { SITE_PRODUCTS } from "@/lib/site-navigation";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import { HeroActions } from "./hero-actions";
import { HeroProductPreview } from "./hero-product-previews";
import { useHeroProductMotion } from "./use-hero-product-motion";
import { UiIcon } from "./ui-icon";
import styles from "./hero-stage.module.css";
import entry from "./hero-entrance.module.css";

const products = [
  { id: "rezebra", preview: "rezebra", ...SITE_PRODUCTS.rezebra, description: "Бронирования, столы и загрузка зала" },
  { id: "flexbonusb", preview: "flexbonus", ...SITE_PRODUCTS.flexbonus, description: "Бонусы, скидки и лояльность гостей" },
  { id: "foxcontrol", preview: "foxcontrol", ...SITE_PRODUCTS.foxControl, description: "Контроль кассовых операций" },
] as const;
const systems = ["r_keeper", "1С", "ЕГАИС", "ККТ", "Честный знак", "Меркурий", "IT-инфраструктура"];
const heroTitle = <>Автоматизация и <span className={styles.unbroken}>IT-сопровождение</span> HoReCa</>;

export function GlowLayer() {
  return <div className="hero-glow-board pointer-events-none absolute inset-0" aria-hidden="true" />;
}

function HeroProducts() {
  const reduced = useHydratedReducedMotion();
  const sceneRef = useHeroProductMotion(reduced);

  function moveGlow(event: PointerEvent<HTMLDivElement>) {
    if (reduced || event.pointerType === "touch") return;
    const panel = event.currentTarget;
    const { left, top, width, height } = panel.getBoundingClientRect();
    panel.style.setProperty("--glow-x", `${100 * (event.clientX - left) / width}%`);
    panel.style.setProperty("--glow-y", `${100 * (event.clientY - top) / height}%`);
  }

  return <div
    className={styles.visual}
    ref={sceneRef}
    role="region"
    aria-label="Собственные продукты Posadmin"
    onPointerEnter={moveGlow}
    onPointerMove={moveGlow}
  >
    <div className={`${styles.boardSurface} ${entry.board}`} aria-hidden="true" />
    <div className={`${styles.visualHeader} ${entry.boardHeading}`}><h2>Наши продукты</h2><span>Развиваем сами</span></div>
    <div className={styles.areas}>
      {products.map(({ id, preview, name, category, description }, index) =>
        <div className={styles.slot} key={id} data-product-motion-card>
          <Link
            href={`/#${id}`}
            className={`${styles.area} ${entry.product}`}
            style={{ "--entry-index": index } as CSSProperties}
          >
            <div className={styles.areaHeader}>
              <span className={styles.areaCategory}>{category}</span>
              <h3>{name}</h3>
              <span className={styles.productArrow}><UiIcon name="arrow-up-right" size={16} /></span>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.description}>{description}</p>
              <HeroProductPreview product={preview} />
            </div>
          </Link>
        </div>
      )}
    </div>
    <div className={`${styles.visualBottom} ${entry.boardFooter}`}><span>Одна команда для ваших систем</span><Link href="/#pricing" className={styles.visualFooter}>Техподдержка 24/7 <UiIcon name="arrow-up-right" size={14} /></Link></div>
  </div>;
}

export function HeroStage() {
  return <div
    className={`${styles.hero} ${entry.sequence}`}
    style={{ "--system-count": systems.length, "--product-count": products.length } as CSSProperties}
  >
    <div className={styles.copy}>
      <h1 className={styles.title}>
        <span className={entry.titleInk}>{heroTitle}</span>
        <span className={entry.titleHaze} aria-hidden="true">{heroTitle}</span>
      </h1>
      <p className={`${styles.lead} ${entry.lead}`}>Разрабатываем решения для вашего заведения и берём на себя технический контур — от касс до IT-инфраструктуры.</p>
      <HeroActions />
      <ul className={styles.systems} role="list" aria-label="Направления работы">
        {systems.map((name, i) => <li key={name} className={entry.system} style={{ "--entry-index": i } as CSSProperties}>{name}</li>)}
      </ul>
      <a className={`${styles.dealer} ${entry.dealer}`} href="https://rkeeper.ru/dealers/" target="_blank" rel="noopener noreferrer">
        Официальный дилер r_keeper <UiIcon name="arrow-up-right" size={14} />
        <span className="sr-only">, откроется в новой вкладке</span>
      </a>
    </div>

    <HeroProducts />
  </div>;
}
