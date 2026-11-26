"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { SITE_CONTACTS } from "@/lib/site-contacts";
import { HOME_NAVIGATION } from "@/lib/site-navigation";
import styles from "./site-header.module.css";

type Page = "home" | "services" | "contacts" | "other";
type Section = typeof HOME_NAVIGATION[number]["id"];
type HeaderSurface = "light" | "dark";
type HeaderSurfaceRegion = {
  surface: HeaderSurface;
  bounds: { left: number; right: number; top: number; bottom: number };
};
export function resolveHeaderSurface(regions: readonly HeaderSurfaceRegion[], x: number, y: number): HeaderSurface {
  // Marked surfaces are in document paint order: a nested panel overrides its
  // parent, and the closing panel comes after the sticky page underneath it.
  for (let index = regions.length - 1; index >= 0; index--) {
    const { surface, bounds } = regions[index];
    if (x >= bounds.left && x < bounds.right && y >= bounds.top && y < bounds.bottom) return surface;
  }
  return "light";
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10m-4-4 4 4-4 4" />
    </svg>
  );
}

function PhoneIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.79a2 2 0 0 1-.45 2.11L8.09 9.89a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.33 1.83.56 2.79.69A2 2 0 0 1 22 16.92Z" />
  </svg>;
}

function TelegramIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
    <path d="m21 3-6.5 18-4-7.5L3 9.5 21 3Z" />
    <path d="m10.5 13.5 5-5" />
  </svg>;
}

export function SiteHeader({ page = "home" }: { page?: Page }) {
  const pathname = usePathname();
  const [surface, setSurface] = useState<HeaderSurface>(page === "home" ? "dark" : "light");
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [previewSection, setPreviewSection] = useState<Section | null>();
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const mobileDisclosureRef = useRef<HTMLDetailsElement>(null);
  const mobileTriggerRef = useRef<HTMLElement>(null);
  const currentSection = page === "home" ? activeSection : page === "contacts" ? "contact" : page === "services" ? "launch" : null;
  const highlightedSection = previewSection === undefined ? currentSection : previewSection;

  const closeMenus = useCallback(() => {
    const menu = mobileDisclosureRef.current;
    if (menu?.open) menu.open = false;
  }, []);

  useEffect(() => {
    const dismissOutside = (event: Event) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) closeMenus();
    };
    const dismissOnLink = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) closeMenus();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !mobileDisclosureRef.current?.open) return;
      mobileTriggerRef.current?.focus();
      closeMenus();
      event.preventDefault();
    };
    const header = headerRef.current;
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    document.addEventListener("keydown", escape);
    header?.addEventListener("click", dismissOnLink);
    window.addEventListener("hashchange", closeMenus);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      document.removeEventListener("keydown", escape);
      header?.removeEventListener("click", dismissOnLink);
      window.removeEventListener("hashchange", closeMenus);
    };
  }, [closeMenus]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    media.addEventListener("change", closeMenus);
    return () => media.removeEventListener("change", closeMenus);
  }, [closeMenus]);

  useEffect(() => {
    const nav = navRef.current;
    const header = headerRef.current;
    if (!nav || !header) return;
    let frame = 0;
    let destination: Section | null | undefined;
    let scrollIdleTimer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      frame = 0;
      const bounds = nav.getBoundingClientRect();
      // A modal makes the rest of the page inert, and decorative hero layers
      // may ignore pointer events. Neither changes the visible page surface,
      // so read its explicit regions instead of hit-testing interactive nodes.
      const regions: HeaderSurfaceRegion[] = Array.from(document.querySelectorAll<HTMLElement>("[data-header-surface]"))
        .filter((element) => !header.contains(element) && !element.closest('dialog, [role="dialog"], [aria-modal="true"], [popover]') && (element.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }) ?? true))
        .map((element) => ({ surface: element.dataset.headerSurface === "dark" ? "dark" : "light", bounds: element.getBoundingClientRect() }));
      const next = resolveHeaderSurface(regions, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
      setSurface((current) => current === next ? current : next);
      // Keep the clicked destination selected while smooth scrolling passes
      // through other sections. Undefined means ordinary scroll tracking.
      if (page !== "home" || destination !== undefined) return;
      const line = window.innerHeight * 0.42;
      const hero = document.querySelector<HTMLElement>("[data-page-hero]");
      if (hero && hero.getBoundingClientRect().bottom > line) {
        setActiveSection(null);
        return;
      }
      // Keep the nearest preceding section active through its supporting
      // content (both calculators belong to accompaniment).
      const current = [...HOME_NAVIGATION].reverse().find(({ id }) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= line;
      });
      setActiveSection(current?.id ?? null);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const finishNavigation = () => {
      if (destination === undefined) return;
      clearTimeout(scrollIdleTimer);
      destination = undefined;
      schedule();
    };
    const awaitScrollEnd = () => {
      clearTimeout(scrollIdleTimer);
      // Also release the selection if no scroll is needed or scrollend is
      // unavailable. Each scroll event restarts this idle fallback.
      scrollIdleTimer = setTimeout(finishNavigation, 180);
    };
    const selectDestination = (event: MouseEvent) => {
      if (page !== "home" || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      const item = HOME_NAVIGATION.find(({ id }) => url.hash === `#${id}`);
      if (url.hash && !item) return;
      destination = item?.id ?? null;
      setActiveSection(destination);
      awaitScrollEnd();
    };
    const onScroll = () => {
      schedule();
      if (destination !== undefined) awaitScrollEnd();
    };
    const onScrollKey = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) finishNavigation();
    };
    schedule();
    header.addEventListener("click", selectDestination);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", finishNavigation);
    window.addEventListener("wheel", finishNavigation, { passive: true });
    window.addEventListener("touchstart", finishNavigation, { passive: true });
    window.addEventListener("keydown", onScrollKey);
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(nav);
    observer.observe(document.body);
    // Re-measure after native dialogs enter/leave the top layer, including a
    // close that does not change the page's dimensions or scroll position.
    const dialogObserver = new MutationObserver(schedule);
    dialogObserver.observe(document.body, { attributes: true, attributeFilter: ["open"], subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(scrollIdleTimer);
      header.removeEventListener("click", selectDestination);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", finishNavigation);
      window.removeEventListener("wheel", finishNavigation);
      window.removeEventListener("touchstart", finishNavigation);
      window.removeEventListener("keydown", onScrollKey);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      dialogObserver.disconnect();
    };
  }, [page, pathname]);

  return (
    <header ref={headerRef} className={`site-header ${styles.header}`} data-surface={surface} data-page={page}>
      <div className={styles.headerInner} style={{ "--header-nav-length": HOME_NAVIGATION.length } as CSSProperties}>
        <nav key={pathname} ref={navRef} className={`site-nav ${styles.nav}`} aria-label="Основное меню"
          onMouseLeave={() => setPreviewSection(undefined)}
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPreviewSection(undefined); }}>
          <Link href="/" aria-label="posadmin, на главную" className={styles.logo} data-highlighted={highlightedSection === null ? "true" : undefined}
            onMouseEnter={() => setPreviewSection(null)} onFocus={() => setPreviewSection(null)}>
            <SiteLogoMark className="site-logo-mark" withDot />
          </Link>
          {HOME_NAVIGATION.map((item, index) => (
            <Link key={item.id} href={item.href}
              className={`${styles.navItem} ${styles.desktopLink}`} aria-current={currentSection === item.id ? "location" : undefined}
              style={{ "--header-item-index": index } as CSSProperties}
              data-highlighted={highlightedSection === item.id ? "true" : undefined}
              onMouseEnter={() => setPreviewSection(item.id)} onFocus={() => setPreviewSection(item.id)}>
              <span className="nav-link">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.contactActions}>
          <a className={`site-header-glass ${styles.phone}`} href={SITE_CONTACTS.phoneHref} aria-label={`Позвонить в Posadmin: ${SITE_CONTACTS.phone}`} data-button-reveal="">
            <PhoneIcon /><span className={styles.phoneNumber}>{SITE_CONTACTS.phone}</span>
          </a>
          <a className={`site-header-glass ${styles.telegram}`} href={SITE_CONTACTS.telegramUrl} target="_blank" rel="noopener noreferrer" aria-label="Написать боту Posadmin в Telegram, откроется в новой вкладке" title="Telegram · @posadmin_request_bot" data-button-reveal="">
            <TelegramIcon />
          </a>
        </div>
        <details key={`mobile-${pathname}`} ref={mobileDisclosureRef} className={styles.mobileDisclosure}>
          <summary ref={mobileTriggerRef} className={`site-nav ${styles.mobileTrigger}`} aria-controls="mobile-site-navigation" data-button-reveal="">
            <span className={`${styles.mobileTriggerLabel} ${styles.openMenuLabel}`}>Меню</span>
            <span className={`${styles.mobileTriggerLabel} ${styles.closeMenuLabel}`}>Закрыть</span>
            <svg className={styles.menuIcon} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
              <path d="M2 8h12" />
              <path d="M2 8h12" />
            </svg>
          </summary>
          <nav id="mobile-site-navigation" aria-label="Мобильное меню" className={`site-mobile-menu ${styles.mobileMenu}`} data-lenis-prevent>
            {HOME_NAVIGATION.map((item, index) => <Link key={item.id} href={item.href} className={styles.mobileItem}
              style={{ "--header-item-index": index } as CSSProperties}
              aria-current={currentSection === item.id ? "location" : undefined}>{item.label}<Arrow /></Link>)}
            <div className={styles.mobileContact}>
              <a className={styles.mobilePhone} href={SITE_CONTACTS.phoneHref} aria-label={`Позвонить в Posadmin: ${SITE_CONTACTS.phone}`} data-button-reveal="">
                <PhoneIcon /><span><small>Позвонить нам</small><span>{SITE_CONTACTS.phone}</span></span>
              </a>
            </div>
          </nav>
        </details>
      </div>
    </header>
  );
}
