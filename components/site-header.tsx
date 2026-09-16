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
  { href: "/uslugi", label: "Услуги" },
] as const;

const itemClass =
  "relative z-10 hidden h-12 w-[90px] shrink-0 items-center justify-center md:flex";

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
  const aboutActive =
    page === "about" ||
    (activeSlide > 0 && !priceActive && !productsActive);
  const [surface, setSurface] = useState<"light" | "dark">("dark");
  const reduced = useHydratedReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const aboutRef = useRef<HTMLAnchorElement>(null);
  const priceRef = useRef<HTMLAnchorElement>(null);
  const productsRef = useRef<HTMLAnchorElement>(null);
  const [capsule, setCapsule] = useState({ x: 0, width: 165 });
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const rightInset = useMotionValue(0);
  const clipPath = useMotionTemplate`inset(0px ${rightInset}px 0px 0px round 30px)`;

  useEffect(() => {
    const nav = navRef.current;
    const header = nav?.closest("header");
    if (!nav || !header) return;

    let frame = 0;
    // The intro moves via CSS transforms without a scroll event. Keep sampling
    // through that transition, then only update on scroll or layout changes.
    const transitionUntil = performance.now() + 2000;

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
      if (performance.now() < transitionUntil) {
        frame = requestAnimationFrame(syncSurface);
      }
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
    const active = productsActive
      ? productsRef.current
      : priceActive
        ? priceRef.current
        : aboutActive
          ? aboutRef.current
          : logoRef.current;
    if (active) placeCapsule(active);
  }, [aboutActive, placeCapsule, priceActive, productsActive]);

  useEffect(() => {
    if (page !== "home") return;
    const pricing = document.querySelector(
      '[aria-labelledby="support-pricing-title"]',
    );
    const products = document.getElementById("products");
    if (!(pricing instanceof HTMLElement) || !products) return;

    const syncActiveSection = () => {
      const pricingBounds = pricing.getBoundingClientRect();
      const productsBounds = products.getBoundingClientRect();
      const activationLine = window.innerHeight * 0.42;
      setPriceActive(
        pricingBounds.top <= activationLine &&
          pricingBounds.bottom >= activationLine,
      );
      setProductsActive(
        productsBounds.top <= activationLine &&
          productsBounds.bottom >= activationLine,
      );
    };

    syncActiveSection();
    window.addEventListener("scroll", syncActiveSection, { passive: true });
    window.addEventListener("resize", syncActiveSection);
    return () => {
      window.removeEventListener("scroll", syncActiveSection);
      window.removeEventListener("resize", syncActiveSection);
    };
  }, [page]);

  useLayoutEffect(() => {
    resetCapsule();
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
      delay: 2.05,
      duration: 0.8,
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
          className="site-nav relative flex h-12 shrink-0 items-center gap-2 overflow-hidden rounded-[30px]"
          aria-label="Основное меню"
          initial={reduced ? false : { y: "115%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          transition={
            reduced
              ? { duration: 0 }
              : { delay: 0.92, duration: 1.15, ease: waveEase }
          }
          style={{
            visibility: ready ? "visible" : "hidden",
            ...(opened ? {} : { clipPath }),
          }}
          onMouseLeave={resetCapsule}
        >
          <motion.span
            className="site-nav-chip pointer-events-none absolute top-0 bottom-0 left-0 z-0 rounded-[30px]"
            initial={false}
            animate={{ x: capsule.x, width: capsule.width }}
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
            className="relative z-10 flex h-12 shrink-0 items-center justify-center px-5 md:px-[35px]"
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
                  {...reveal(2.18 + i * 0.07, reduced)}
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          })}
          <Link
            href={page === "about" ? "#contact" : "/#contact"}
            className="relative z-10 flex h-12 shrink-0 items-center gap-2.5 pr-5 pl-4 md:flex"
            onMouseEnter={(event) => placeCapsule(event.currentTarget, true)}
          >
            <motion.span
              className="nav-link relative inline-block whitespace-nowrap"
              {...reveal(2.46, reduced)}
            >
              Контакты
            </motion.span>
            <motion.span
              className="relative inline-block"
              {...reveal(2.52, reduced)}
            >
              <NavArrow />
            </motion.span>
          </Link>
        </motion.nav>
      </div>
    </header>
  );
}
