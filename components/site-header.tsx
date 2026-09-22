"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
} from "framer-motion";
import { useParallaxActiveSlide } from "@/components/full-page-parallax";
import { SiteLogoMark } from "@/components/site-logo-mark";
import { useHydratedReducedMotion } from "@/components/use-hydrated-reduced-motion";

const links = [
  { href: "/#about", label: "О нас" },
  { href: "/#pricing", label: "Прайс" },
  { href: "/#products", label: "Продукты" },
] as const;

const itemClass =
  "relative z-10 hidden h-12 w-[90px] shrink-0 items-center justify-center rounded-[8px] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--accent-focus)] md:flex";

const waveEase = [0.33, 1, 0.68, 1] as const;
const openEase = [0.22, 1, 0.36, 1] as const;

function reveal(delay: number, reduced: boolean | null) {
  if (reduced) {
    return { initial: false as const, animate: { opacity: 1, x: 0 } };
  }
  return {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { delay, duration: 0.4, ease: openEase },
  };
}

function NavArrow() {
  return (
    <div className="flex items-center justify-center">
      <div className="-scale-y-100 rotate-180">
        <div className="relative size-[5.251px]">
          <div className="absolute inset-[-9.52%]">
            <img
              src="/figma-hero/nav-arrow.svg"
              alt=""
              className="block size-full max-w-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SiteHeader({ page = "home" }: { page?: "home" | "about" }) {
  const activeSlide = useParallaxActiveSlide();
  const [priceActive, setPriceActive] = useState(false);
  const [productsActive, setProductsActive] = useState(false);
  const [contactActive, setContactActive] = useState(false);
  const aboutActive =
    !contactActive &&
    (page === "about" ||
      (activeSlide > 0 && !priceActive && !productsActive));
  const [surface, setSurface] = useState<"light" | "dark">("dark");
  const reduced = useHydratedReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const aboutRef = useRef<HTMLAnchorElement>(null);
  const priceRef = useRef<HTMLAnchorElement>(null);
  const productsRef = useRef<HTMLAnchorElement>(null);
  const contactRef = useRef<HTMLAnchorElement>(null);
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const [capsule, setCapsule] = useState({ x: 0, width: 165 });
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const rightInset = useMotionValue(0);
  const clipPath = useMotionTemplate`inset(0px ${rightInset}px 0px 0px round 12px)`;

  useEffect(() => {
    const dismiss = (event: MouseEvent) => {
      const menu = mobileMenuRef.current;
      if (!menu?.open || !(event.target instanceof Element)) return;
      if (!menu.contains(event.target) || event.target.closest("a")) menu.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !mobileMenuRef.current?.open) return;
      mobileMenuRef.current.open = false;
      mobileMenuRef.current.querySelector("summary")?.focus();
    };
    document.addEventListener("click", dismiss, true);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", dismiss, true);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    const header = nav?.closest("header");
    if (!nav || !header) return;

    let frame = 0;
    const syncSurface = () => {
      frame = 0;
      const bounds = nav.getBoundingClientRect();
      const x = bounds.left + bounds.width / 2;
      const y = bounds.top + bounds.height / 2;
      const underneath = document
        .elementsFromPoint(x, y)
        .find((element) => !header.contains(element));
      const background = underneath?.closest<HTMLElement>("[data-header-surface]");
      const next = background?.dataset.headerSurface === "dark" ? "dark" : "light";

      setSurface((current) => (current === next ? current : next));
    };

    const scheduleSync = () => {
      if (!frame) frame = requestAnimationFrame(syncSurface);
    };

    scheduleSync();
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);
    const resizeObserver = new ResizeObserver(scheduleSync);
    resizeObserver.observe(nav);
    resizeObserver.observe(document.body);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      resizeObserver.disconnect();
    };
  }, [activeSlide, page]);

  const placeCapsule = useCallback((el: HTMLElement, fillToEnd = false) => {
    const nav = navRef.current;
    if (!nav) return;
    const x = el.offsetLeft;
    setCapsule({
      x,
      width: fillToEnd ? nav.clientWidth - x : el.offsetWidth,
    });
  }, []);

  const resetCapsule = useCallback(() => {
    const active = contactActive
      ? contactRef.current
      : productsActive
        ? productsRef.current
        : priceActive
          ? priceRef.current
          : aboutActive
            ? aboutRef.current
            : logoRef.current;
    const visibleActive = active?.offsetWidth ? active : logoRef.current;
    if (visibleActive) placeCapsule(visibleActive, visibleActive === contactRef.current);
  }, [aboutActive, contactActive, placeCapsule, priceActive, productsActive]);

  useEffect(() => {
    const syncActiveSection = () => {
      // The responsive scroll layout can remount the sections. Read the
      // current nodes instead of retaining detached ones across breakpoints.
      const activationLine = window.innerHeight * 0.42;
      const intersectsActivationLine = (id: string) => {
        const section = document.getElementById(id);
        if (!section) return false;
        const bounds = section.getBoundingClientRect();
        return bounds.top <= activationLine && bounds.bottom >= activationLine;
      };
      const contacts = intersectsActivationLine("contact");
      setContactActive(contacts);
      setPriceActive(page === "home" && !contacts && (intersectsActivationLine("pricing") || intersectsActivationLine("it-pricing")));
      setProductsActive(page === "home" && !contacts && intersectsActivationLine("products"));
    };

    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);
    const observer = new ResizeObserver(syncActiveSection);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
      observer.disconnect();
    };
  }, [page]);

  useLayoutEffect(() => {
    resetCapsule();
    const nav = navRef.current;
    if (!nav) return;
    const observer = new ResizeObserver(resetCapsule);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [reduced, resetCapsule]);

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

    const navWidth = nav.getBoundingClientRect().width;
    const logoWidth = logo.getBoundingClientRect().width;
    rightInset.set(Math.max(0, navWidth - logoWidth));
    setOpened(false);
    setReady(true);

    const controls = animate(rightInset, 0, {
      delay: 0.35,
      duration: 0.55,
      ease: openEase,
    });
    void controls.then(() => setOpened(true));
    return () => controls.stop();
  }, [reduced, rightInset]);

  return (
    <header
      className="site-header fixed top-0 left-0 z-50 h-20 w-full bg-transparent"
      data-surface={surface}
      data-page={page}
    >
      <div className="mx-auto flex h-full w-full max-w-[1440px] items-center justify-center px-4 md:px-10 xl:px-[120px]">
        <motion.nav
          ref={navRef}
          className="site-nav relative flex h-12 shrink-0 items-center gap-2 overflow-hidden rounded-[12px]"
          aria-label="Основное меню"
          initial={reduced ? false : { y: 12, opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { delay: 0.08, duration: 0.55, ease: waveEase }
          }
          style={{
            visibility: ready ? "visible" : "hidden",
            ...(opened ? {} : { clipPath }),
          }}
          onMouseLeave={resetCapsule}
        >
          <motion.span
            className="site-nav-chip pointer-events-none absolute top-[3px] bottom-[3px] left-[3px] z-0 rounded-[8px]"
            initial={false}
            animate={{ x: capsule.x, width: Math.max(0, capsule.width - 6) }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 }
            }
          />
          <Link
            ref={logoRef}
            href="/"
            aria-label="posadmin, на главную"
            className="relative z-10 flex h-12 shrink-0 items-center justify-center rounded-[8px] px-5 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--accent-focus)] md:px-[35px]"
            onMouseEnter={(event) => placeCapsule(event.currentTarget)}
          >
            <span className="relative inline-block h-[17.43px] w-[94.795px] overflow-hidden">
              <span className="block">
                <SiteLogoMark className="site-logo-mark block h-[17.43px] w-[94.795px]" />
              </span>
            </span>
          </Link>
          {links.map((item, i) => {
            const href =
              page === "about" && item.href === "/#about"
                ? "/about"
                : item.href;
            const active =
              (item.href === "/#about" && aboutActive) ||
              (item.href === "/#pricing" && priceActive) ||
              (item.href === "/#products" && productsActive);

            return (
              <Link
                key={item.href}
                ref={
                  item.href === "/#about"
                    ? aboutRef
                    : item.href === "/#pricing"
                      ? priceRef
                      : item.href === "/#products"
                        ? productsRef
                        : undefined
                }
                href={href}
                className={itemClass}
                aria-current={active ? "page" : undefined}
                onMouseEnter={(event) => placeCapsule(event.currentTarget)}
              >
                <motion.span
                  className="nav-link relative inline-block whitespace-nowrap"
                  data-active={active ? "true" : undefined}
                  {...reveal(0.48 + i * 0.035, reduced)}
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
          <Link
            ref={contactRef}
            href={page === "about" ? "#contact" : "/#contact"}
            className="relative z-10 hidden h-12 shrink-0 items-center gap-2.5 rounded-[8px] pr-5 pl-4 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[var(--accent-focus)] min-[400px]:flex"
            aria-current={contactActive ? "page" : undefined}
            onMouseEnter={(event) => placeCapsule(event.currentTarget, true)}
          >
            <motion.span
              className="nav-link relative inline-block whitespace-nowrap"
              data-active={contactActive ? "true" : undefined}
              {...reveal(0.64, reduced)}
            >
              Контакты
            </motion.span>
            <motion.span
              className="relative inline-block"
              {...reveal(0.68, reduced)}
            >
              <NavArrow />
            </motion.span>
          </Link>
        </motion.nav>
        <details ref={mobileMenuRef} className="relative ml-2 shrink-0 md:hidden">
          <summary className="site-nav flex h-12 cursor-pointer list-none items-center justify-center rounded-[10px] px-4 font-[family-name:var(--font-inter)] text-[13px] font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-focus)] [&::-webkit-details-marker]:hidden">Меню</summary>
          <nav aria-label="Мобильное меню" className="site-mobile-menu fixed top-[76px] right-4 left-4 grid gap-1 rounded-[12px] border border-[rgb(245_245_237_/_0.12)] p-3 font-[family-name:var(--font-inter)] shadow-[0_16px_40px_rgba(50,47,43,0.16)]">
            {links.map((item) => {
              const active =
                (item.href === "/#about" && aboutActive) ||
                (item.href === "/#pricing" && priceActive) ||
                (item.href === "/#products" && productsActive);
              return <Link key={item.href} href={page === "about" && item.href === "/#about" ? "/about" : item.href} aria-current={active ? "page" : undefined} className="flex min-h-12 items-center justify-between rounded-lg px-4 text-[14px] hover:bg-[rgb(245_245_237_/_0.12)] focus-visible:outline-2 focus-visible:outline-[var(--milk)]">{item.label}<span aria-hidden="true">↗</span></Link>;
            })}
            <Link href={page === "about" ? "#contact" : "/#contact"} aria-current={contactActive ? "page" : undefined} className="flex min-h-12 items-center justify-between rounded-lg px-4 text-[14px] hover:bg-[rgb(245_245_237_/_0.12)] focus-visible:outline-2 focus-visible:outline-[var(--milk)]">Контакты<span aria-hidden="true">↗</span></Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
