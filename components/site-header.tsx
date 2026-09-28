"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { animate, motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { useParallaxActiveSlide } from "@/components/full-page-parallax";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";
import { HOME_NAVIGATION } from "@/lib/site-navigation";
import styles from "./site-header.module.css";

type Page = "home" | "about" | "services" | "contacts" | "other";
type Section = typeof HOME_NAVIGATION[number]["id"];
const waveEase = [0.33, 1, 0.68, 1] as const;
const openEase = [0.22, 1, 0.36, 1] as const;

function reveal(delay: number, reduced: boolean) {
  return reduced
    ? { initial: false as const, animate: { opacity: 1, x: 0 } }
    : { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, transition: { delay, duration: 0.4, ease: openEase } };
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10m-4-4 4 4-4 4" />
    </svg>
  );
}

export function SiteHeader({ page = "home" }: { page?: Page }) {
  const pathname = usePathname();
  const activeSlide = useParallaxActiveSlide();
  const reduced = useHydratedReducedMotion();
  const [surface, setSurface] = useState<"light" | "dark">(page === "home" || page === "about" ? "dark" : "light");
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const linkRefs = useRef<Partial<Record<Section, HTMLAnchorElement | null>>>({});
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const [capsule, setCapsule] = useState({ x: 0, width: 145 });
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const rightInset = useMotionValue(0);
  const clipPath = useMotionTemplate`inset(0px ${rightInset}px 0px 0px round 12px)`;
  const currentSection = page === "home" ? activeSection : page === "contacts" ? "contact" : page === "about" || page === "services" ? page : null;

  const closeMenus = useCallback(() => {
    setMobileOpen(false);
  }, []);

  useEffect(() => { closeMenus(); }, [pathname, closeMenus]);

  useEffect(() => {
    const dismissOutside = (event: Event) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) closeMenus();
    };
    const dismissOnLink = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) closeMenus();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !mobileOpen) return;
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
  }, [closeMenus, mobileOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    media.addEventListener("change", closeMenus);
    return () => media.removeEventListener("change", closeMenus);
  }, [closeMenus]);

  useEffect(() => {
    const nav = navRef.current;
    const header = headerRef.current;
    if (!nav || !header) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const bounds = nav.getBoundingClientRect();
      const underneath = document.elementsFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2).find((element) => !header.contains(element));
      const background = underneath?.closest<HTMLElement>("[data-header-surface]");
      const next = background?.dataset.headerSurface === "dark" ? "dark" : "light";
      setSurface((current) => current === next ? current : next);
      if (page !== "home") return;
      const line = window.innerHeight * 0.42;
      const hero = document.querySelector<HTMLElement>("[data-hero-curtain]");
      if (hero && hero.getBoundingClientRect().bottom > line) {
        setActiveSection(null);
        return;
      }
      // Keep the nearest preceding section active through its supporting
      // content (clients belong to about; both calculators belong to tariffs).
      const current = [...HOME_NAVIGATION].reverse().find(({ id }) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= line;
      });
      setActiveSection(current?.id ?? null);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(nav);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [activeSlide, page, pathname]);

  const placeCapsule = useCallback((element: HTMLElement) => {
    const nav = navRef.current;
    if (!nav) return;
    const bounds = element.getBoundingClientRect();
    setCapsule({ x: bounds.left - nav.getBoundingClientRect().left, width: bounds.width });
  }, []);

  const resetCapsule = useCallback(() => {
    const active = currentSection ? linkRefs.current[currentSection] : logoRef.current;
    const visible = active?.offsetWidth ? active : logoRef.current;
    if (visible) placeCapsule(visible);
  }, [currentSection, placeCapsule]);

  useLayoutEffect(() => {
    resetCapsule();
    const nav = navRef.current;
    if (!nav) return;
    const observer = new ResizeObserver(resetCapsule);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [pathname, resetCapsule]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const logo = logoRef.current;
    if (!nav || !logo) return;
    if (reduced) {
      rightInset.set(0);
      setOpened(true);
      setReady(true);
      return;
    }
    rightInset.set(Math.max(0, nav.getBoundingClientRect().width - logo.getBoundingClientRect().width));
    setOpened(false);
    setReady(true);
    const controls = animate(rightInset, 0, { delay: 0.35, duration: 0.55, ease: openEase });
    void controls.then(() => setOpened(true));
    return () => controls.stop();
  }, [pathname, reduced, rightInset]);

  const entry = {
    initial: reduced ? false as const : { y: 12, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: reduced ? { duration: 0 } : { delay: 0.08, duration: 0.55, ease: waveEase },
  };

  return (
    <header ref={headerRef} className={`site-header ${styles.header}`} data-surface={surface} data-page={page}>
      <noscript><style>{`.site-header .site-nav { visibility: visible !important; opacity: 1 !important; clip-path: none !important; transform: none !important; } .site-header .site-nav span { opacity: 1 !important; transform: none !important; } .site-header [data-nav-fallback] { display: flex !important; }`}</style></noscript>
      <div className={styles.headerInner}>
        <motion.nav key={pathname} ref={navRef} className={`site-nav ${styles.nav}`} aria-label="Основное меню" {...entry} style={{ visibility: ready ? "visible" : "hidden", clipPath: opened ? "none" : clipPath }} onMouseLeave={resetCapsule} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) resetCapsule(); }}>
          <motion.span aria-hidden="true" className={`site-nav-chip ${styles.chip}`} initial={false} animate={{ x: capsule.x, width: Math.max(0, capsule.width - 6) }} transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 }} />
          <Link ref={logoRef} href="/" aria-label="posadmin, на главную" className={styles.logo} onMouseEnter={(event) => placeCapsule(event.currentTarget)} onFocus={(event) => placeCapsule(event.currentTarget)}>
            <SiteLogoMark className="site-logo-mark" />
          </Link>
          {HOME_NAVIGATION.map((item, index) => (
            <Link key={item.id} ref={(element) => { linkRefs.current[item.id] = element; }} href={item.href}
              className={`${styles.navItem} ${styles.desktopLink}`} aria-current={currentSection === item.id ? "location" : undefined}
              onMouseEnter={(event) => placeCapsule(event.currentTarget)} onFocus={(event) => placeCapsule(event.currentTarget)}>
              <motion.span className="nav-link" data-active={currentSection === item.id ? "true" : undefined} {...reveal(0.48 + index * 0.035, reduced)}>{item.label}</motion.span>
            </Link>
          ))}
        </motion.nav>
        <motion.button key={`mobile-${pathname}`} ref={mobileTriggerRef} className={`site-nav ${styles.mobileTrigger}`} type="button" aria-expanded={mobileOpen} aria-controls="mobile-site-navigation" {...entry} style={{ visibility: ready ? "visible" : "hidden" }} onClick={() => setMobileOpen((current) => !current)}>
          {mobileOpen ? "Закрыть" : "Меню"}<span aria-hidden="true" className={styles.menuIcon} data-open={mobileOpen}><span /><span /></span>
        </motion.button>
        <nav id="mobile-site-navigation" aria-label="Мобильное меню" className={`site-mobile-menu ${styles.mobileMenu}`} hidden={!mobileOpen} data-lenis-prevent>
          {HOME_NAVIGATION.map((item) => <Link key={item.id} href={item.href} className={styles.mobileItem} aria-current={currentSection === item.id ? "location" : undefined}>{item.label}<Arrow /></Link>)}
        </nav>
        <div data-nav-fallback className={styles.noScriptLinks}>{HOME_NAVIGATION.map((item) => <Link key={item.id} href={item.href}>{item.label}</Link>)}</div>
      </div>
    </header>
  );
}
