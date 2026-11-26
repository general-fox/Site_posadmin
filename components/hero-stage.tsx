"use client";

import Link from "next/link";
import type { PointerEvent, RefObject } from "react";
import { SITE_PRODUCTS } from "@/lib/site-navigation";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import { HeroActions } from "./hero-actions";
import { HeroProductPreview } from "./hero-product-previews";
import { useHeroProductMotion } from "./use-hero-product-motion";
import { RevealWords, useScrollReveal } from "./marketing-ui";
import { UiIcon } from "./ui-icon";
import styles from "./hero-stage.module.css";
import entry from "./hero-entrance.module.css";

const products = [
  { id: "rezebra", preview: "rezebra", ...SITE_PRODUCTS.rezebra, description: "Бронирования, столы и загрузка зала" },
  { id: "flexbonusb", preview: "flexbonus", ...SITE_PRODUCTS.flexbonus, description: "Бонусы, скидки и лояльность гостей" },
  { id: "foxcontrol", preview: "foxcontrol", ...SITE_PRODUCTS.foxControl, description: "Контроль кассовых операций" },
] as const;
const systems = ["r_keeper", "1С", "ЕГАИС", "ККТ", "Честный знак", "Меркурий", "IT-инфраструктура"];

export function GlowLayer() {
  return <div className="hero-glow-board pointer-events-none absolute inset-0" aria-hidden="true" />;
}

function HeroProduct({ product, index, after }: {
  product: (typeof products)[number];
  index: number;
  after: RefObject<HTMLElement | null>;
}) {
  const revealRef = useScrollReveal<HTMLDivElement>({
    motion: "lift", blur: false, after, delay: index * 0.09, animateOnMount: true,
  });
  const { id, preview, name, category, description } = product;

  return <div className={styles.slot} ref={revealRef} data-product-motion-card data-scroll-reveal="" data-reveal-on-load="">
    <Link href={`/#${id}`} className={styles.area}>
      <div className={styles.areaCopy}>
        <span className={styles.areaCategory}>{category}</span>
        <h3>{name}</h3>
        <span className={styles.productArrow}><UiIcon name="arrow-up-right" size={16} /></span>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.cardArt}><HeroProductPreview product={preview} /></div>
    </Link>
  </div>;
}

function HeroProducts({ after }: { after: RefObject<HTMLElement | null> }) {
  const reduced = useHydratedReducedMotion();
  const sceneRef = useHeroProductMotion(reduced);
  const surfaceRef = useScrollReveal<HTMLDivElement>({ motion: "lift", blur: false, after, animateOnMount: true });
  const headingRef = useScrollReveal<HTMLHeadingElement>({ after, animateOnMount: true });
  const captionRef = useScrollReveal<HTMLSpanElement>({ after: headingRef, animateOnMount: true });
  const footerRef = useScrollReveal<HTMLDivElement>({ motion: "lift", blur: false, after: headingRef, animateOnMount: true });

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
    <div className={styles.boardSurface} ref={surfaceRef} aria-hidden="true" data-scroll-reveal="" data-reveal-on-load="" />
    <div className={styles.visualHeader}>
      <h2 ref={headingRef} data-scroll-reveal="" data-reveal-on-load=""><RevealWords>Наши продукты</RevealWords></h2>
      <span ref={captionRef} data-scroll-reveal="" data-reveal-on-load="">Развиваем сами</span>
    </div>
    <div className={styles.areas}>
      {products.map((product, index) =>
        <HeroProduct key={product.id} product={product} index={index} after={headingRef} />
      )}
    </div>
    <div className={styles.visualBottom} ref={footerRef} data-scroll-reveal="" data-reveal-on-load=""><span>Одна команда для ваших систем</span><Link href="/#pricing" className={styles.visualFooter}>Техподдержка 24/7 <UiIcon name="arrow-up-right" size={14} /></Link></div>
  </div>;
}

export function HeroStage() {
  const headingRef = useScrollReveal<HTMLHeadingElement>({ delay: 0.12, animateOnMount: true });
  const leadRef = useScrollReveal<HTMLParagraphElement>({ after: headingRef, animateOnMount: true });
  const actionsRef = useScrollReveal<HTMLDivElement>({ motion: "lift", blur: false, after: leadRef, animateOnMount: true });
  const systemsRef = useScrollReveal<HTMLUListElement>({ motion: "lift", sequence: true, blur: false, after: actionsRef, animateOnMount: true });
  const dealerRef = useScrollReveal<HTMLAnchorElement>({ motion: "lift", blur: false, after: systemsRef, animateOnMount: true });

  return <div className={`${styles.hero} ${entry.sequence}`}>
    <div className={styles.copy}>
      <h1 className={styles.title} ref={headingRef} data-scroll-reveal="" data-reveal-on-load=""><RevealWords>Автоматизация и <span className={styles.unbroken}>IT-сопровождение</span> HoReCa</RevealWords></h1>
      <p className={styles.lead} ref={leadRef} data-scroll-reveal="" data-reveal-on-load="">Разрабатываем решения для вашего заведения и берём на себя технический контур — от касс до IT-инфраструктуры.</p>
      <div ref={actionsRef} data-scroll-reveal="" data-reveal-on-load=""><HeroActions /></div>
      <ul className={styles.systems} ref={systemsRef} role="list" aria-label="Направления работы" data-scroll-reveal="" data-reveal-on-load="">
        {systems.map((name) => <li key={name} data-reveal-item="">{name}</li>)}
      </ul>
      <a className={styles.dealer} ref={dealerRef} href="https://rkeeper.ru/dealers/" target="_blank" rel="noopener noreferrer" data-scroll-reveal="" data-reveal-on-load="">
        Официальный дилер r_keeper <UiIcon name="arrow-up-right" size={14} />
        <span className="sr-only">, откроется в новой вкладке</span>
      </a>
    </div>

    <HeroProducts after={dealerRef} />
  </div>;
}
