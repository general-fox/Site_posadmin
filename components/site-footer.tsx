"use client";

import Link from "next/link";
import { SiteLogoMark } from "./site-logo-mark";
import styles from "./site-footer.module.css";
import { ArrowRight } from "./marketing-ui";
import { SITE_CONTACTS } from "@/lib/site-contacts";
import { HeroDust } from "./hero-dust";

export function SiteFooter({ page = "home" }: { page?: "home" | "about" }) {
  return (
    <footer className={styles.footer} data-header-surface="dark">
      <div className={styles.dust} aria-hidden="true"><HeroDust coverage="full" subtle /></div>
      <div className={styles.reveal}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link className={styles.logo} href="/" aria-label="Posadmin — на главную">
            <SiteLogoMark className="h-auto w-[164px]" />
          </Link>
          <p className={styles.tagline}>Технологии работают.<br />Вы занимаетесь своим делом.</p>
          <p className={styles.caption}>Автоматизация, сопровождение<br />и развитие ресторанного бизнеса.</p>
        </div>
        <nav className={styles.column} aria-label="Разделы внизу страницы">
          <h2>Компания</h2>
          <ul>
            <li><Link href="/about">О нас</Link></li>
            <li><Link href="/#pricing">Прайс</Link></li>
            <li><Link href="/#products">Продукты</Link></li>
            <li><Link href={page === "about" ? "#contact" : "/#contact"}>Контакты</Link></li>
          </ul>
        </nav>
        <nav className={styles.column} aria-label="Продукты Posadmin">
          <h2>Наши продукты</h2>
          <ul>
            <li><a className={styles.productLink} href="https://rezebra.ru/" target="_blank" rel="noopener noreferrer" aria-label="ReZebra — сайт продукта, откроется в новой вкладке">ReZebra<ArrowRight diagonal /></a><p className={styles.productNote}>Бронирование столов</p></li>
            <li><Link href="/#products">FexBonus</Link><p className={styles.productNote}>Лояльность гостей</p></li>
          </ul>
        </nav>
        <div className={`${styles.column} ${styles.contact}`}>
          <h2>На связи</h2>
          <a className={styles.phone} href={SITE_CONTACTS.phoneHref}>{SITE_CONTACTS.phone}</a>
          <p className={styles.hours}>Менеджер: {SITE_CONTACTS.managerHours.toLowerCase()}</p>
          <a className={styles.telegram} href={SITE_CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer" aria-label="Написать менеджеру в Telegram, откроется в новой вкладке">Написать в Telegram<ArrowRight diagonal /></a>
          <p className={styles.support}>Техническая поддержка — 24/7</p>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© 2026 Posadmin</p>
        <Link className={styles.locations} href={page === "about" ? "#contact" : "/#contact"}>Люберцы <span aria-hidden="true">·</span> Новороссийск</Link>
      </div>
      </div>
    </footer>
  );
}
