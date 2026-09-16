"use client";

import Lenis from "lenis";
import {
  Children,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const TRANSITION_MS = 1200;
const REVERSE_GRACE_MS = 280;
const WHEEL_THRESHOLD = 48;
const SWIPE_THRESHOLD = 45;
const INTRO_SLIDES = 2;
const INTRO_TOP_PX = 8;
const LENIS_GESTURE_LERP = 0.16;
const LENIS_ANCHOR_DURATION = 1;

const easeOutQuart = (progress: number) => 1 - (1 - progress) ** 4;

const ParallaxEntryContext = createContext(0);
const ParallaxActiveSlideContext = createContext(0);
const ParallaxAnimationCycleContext = createContext(0);

export function useParallaxEntry() {
  return useContext(ParallaxEntryContext);
}

export function useParallaxActiveSlide() {
  return useContext(ParallaxActiveSlideContext);
}

export function useParallaxAnimationCycle() {
  return useContext(ParallaxAnimationCycleContext);
}

export function FullPageParallax({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  const slides = Children.toArray(children);
  const introSlides = slides.slice(0, INTRO_SLIDES);
  const regularSlides = slides.slice(INTRO_SLIDES);
  const [activeSlide, setActiveSlide] = useState(0);
  const [headerSurfaceSlide, setHeaderSurfaceSlide] = useState(0);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [compactFlow, setCompactFlow] = useState(false);
  const [entryCounts, setEntryCounts] = useState(() =>
    slides.map(() => 0),
  );
  const lockedUntil = useRef(0);
  const compactSurface = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const wheelIntent = useRef({ delta: 0, timestamp: 0 });
  const headerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pendingScroll = useRef<{
    target: number | HTMLElement;
    offset?: number;
  } | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px), (max-height: 520px)");
    const sync = () => setCompactFlow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (compactFlow || window.scrollY <= 2) return;

    // Browsers preserve the scroll position after a refresh/HMR update. Keep
    // the intro state in sync so the restored regular content never gets
    // trapped behind the first-slide scroll lock.
    setActiveSlide(1);
    setHeaderSurfaceSlide(1);
  }, [compactFlow]);

  useEffect(() => {
    if (!compactFlow) return;

    const syncSurface = () => {
      const next = window.scrollY >= window.innerHeight - 80 ? 1 : 0;
      if (next === 1 && compactSurface.current === 0) {
        setAnimationCycle((cycle) => cycle + 1);
      }
      compactSurface.current = next;
      setHeaderSurfaceSlide(next);
    };

    syncSurface();
    window.addEventListener("scroll", syncSurface, { passive: true });
    return () => window.removeEventListener("scroll", syncSurface);
  }, [compactFlow]);

  const moveTo = (nextSlide: number) => {
    const now = Date.now();
    const boundedSlide = Math.max(
      0,
      Math.min(introSlides.length - 1, nextSlide),
    );
    if (boundedSlide === activeSlide) return;

    const reversing = boundedSlide < activeSlide;
    if (reversing) {
      if (now < lockedUntil.current - (TRANSITION_MS - REVERSE_GRACE_MS)) {
        return;
      }
    } else if (now < lockedUntil.current) {
      return;
    }

    lockedUntil.current = now + TRANSITION_MS;
    if (headerTimer.current) clearTimeout(headerTimer.current);
    if (reversing) {
      setHeaderSurfaceSlide(boundedSlide);
    } else {
      headerTimer.current = setTimeout(
        () => setHeaderSurfaceSlide(boundedSlide),
        TRANSITION_MS * 0.46,
      );
    }
    setEntryCounts((counts) =>
      counts.map((count, index) =>
        index === boundedSlide ? count + 1 : count,
      ),
    );
    if (boundedSlide === 1 && activeSlide === 0) {
      setAnimationCycle((cycle) => cycle + 1);
    }
    setActiveSlide(boundedSlide);
  };

  const scrollWithLenis = (
    target: number | HTMLElement,
    offset = 0,
  ) => {
    pendingScroll.current = { target, offset };
    const lenis = lenisRef.current;
    if (!lenis) return;

    pendingScroll.current = null;
    lenis.scrollTo(target, {
      offset,
      duration: LENIS_ANCHOR_DURATION,
      easing: easeOutQuart,
      lerp: 0,
    });
  };

  useLayoutEffect(() => {
    if (compactFlow) return;
    window.scrollTo(0, 0);
  }, [activeSlide, compactFlow]);

  useEffect(
    () => () => {
      if (headerTimer.current) clearTimeout(headerTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (compactFlow) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (window.scrollY > INTRO_TOP_PX) return;

      if (["ArrowDown", "PageDown"].includes(event.key) && activeSlide === 0) {
        event.preventDefault();
        moveTo(1);
      }

      if (["ArrowUp", "PageUp", "Home"].includes(event.key) && activeSlide === 1) {
        event.preventDefault();
        moveTo(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    if (compactFlow) return;

    const handleIntroWheel = (event: WheelEvent) => {
      const movingForward =
        activeSlide === 0 && window.scrollY <= 2 && event.deltaY > 0;
      const movingBackward =
        activeSlide === 1 &&
        window.scrollY <= INTRO_TOP_PX &&
        event.deltaY < 0;

      if (!movingForward && !movingBackward) {
        wheelIntent.current.delta = 0;
        return;
      }

      event.preventDefault();

      const now = Date.now();
      const multiplier =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      const normalizedDelta = event.deltaY * multiplier;
      const previous = wheelIntent.current;

      if (
        now - previous.timestamp > 180 ||
        Math.sign(previous.delta) !== Math.sign(normalizedDelta)
      ) {
        previous.delta = 0;
      }

      previous.delta += normalizedDelta;
      previous.timestamp = now;

      const thresholdReached = movingForward
        ? previous.delta >= WHEEL_THRESHOLD
        : previous.delta <= -WHEEL_THRESHOLD;

      if (!thresholdReached || Date.now() < lockedUntil.current) return;

      previous.delta = 0;
      moveTo(movingForward ? 1 : 0);
    };

    window.addEventListener("wheel", handleIntroWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleIntroWheel);
  });

  useEffect(() => {
    if (compactFlow || activeSlide !== 1) return;

    let lenis: Lenis | null = null;
    let activationTimer: ReturnType<typeof setTimeout> | null = null;
    let activationFrame = 0;
    let guardingIntroGesture =
      Date.now() < lockedUntil.current && window.scrollY <= INTRO_TOP_PX;

    const runPendingScroll = () => {
      const request = pendingScroll.current;
      if (!request || !lenis || lenisRef.current !== lenis) return;

      pendingScroll.current = null;
      lenis.scrollTo(request.target, {
        offset: request.offset ?? 0,
        duration: LENIS_ANCHOR_DURATION,
        easing: easeOutQuart,
        lerp: 0,
      });
    };

    const startLenis = () => {
      if (lenis) return;
      guardingIntroGesture = false;
      window.removeEventListener("wheel", guardIntroGesture);
      if (activationTimer) clearTimeout(activationTimer);
      activationTimer = null;

      lenis = new Lenis({
        autoRaf: true,
        lerp: LENIS_GESTURE_LERP,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.92,
        overscroll: true,
        anchors: false,
        stopInertiaOnNavigate: true,
      });
      lenisRef.current = lenis;
      activationFrame = requestAnimationFrame(runPendingScroll);
    };

    const scheduleStart = () => {
      if (activationTimer) clearTimeout(activationTimer);
      activationTimer = setTimeout(startLenis, 120);
    };

    function guardIntroGesture(event: WheelEvent) {
      if (!guardingIntroGesture || event.deltaY <= 0) return;
      event.preventDefault();
      window.scrollTo(0, 0);
      scheduleStart();
    }

    if (guardingIntroGesture) {
      window.scrollTo(0, 0);
      window.addEventListener("wheel", guardIntroGesture, { passive: false });
      scheduleStart();
    } else {
      startLenis();
    }

    return () => {
      if (activationTimer) clearTimeout(activationTimer);
      if (activationFrame) cancelAnimationFrame(activationFrame);
      window.removeEventListener("wheel", guardIntroGesture);
      if (lenisRef.current === lenis) lenisRef.current = null;
      lenis?.destroy();
    };
  }, [compactFlow, activeSlide]);

  useLayoutEffect(() => {
    const hash = window.location.hash;
    if (hash !== "#about" && hash !== "#pricing" && hash !== "#products") return;

    if (compactFlow) {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ block: "start" });
      return;
    }

    setActiveSlide(1);
    setHeaderSurfaceSlide(1);
    if (hash === "#pricing" || hash === "#products") {
      const target = document.getElementById(hash.slice(1));
      if (target) pendingScroll.current = { target };
    }
  }, [compactFlow]);

  useEffect(() => {
    const openAbout = () => {
      if (window.location.hash !== "#about") return;
      pendingScroll.current = null;
      if (compactFlow) {
        document.getElementById("about")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }
      if (activeSlide === 0) moveTo(1);
      else scrollWithLenis(0);
    };

    const goHome = () => {
      pendingScroll.current = null;
      if (compactFlow) {
        window.scrollTo({ top: 0 });
        return;
      }
      if (activeSlide !== 0) moveTo(0);
      window.scrollTo(0, 0);
    };

    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      const url = new URL(href, window.location.href);
      if (url.pathname !== window.location.pathname) return;

      if (href.includes("#about")) {
        event.preventDefault();
        event.stopPropagation();
        if (window.location.hash !== "#about") {
          history.pushState(null, "", "#about");
        }
        openAbout();
        return;
      }

      if (href.includes("#pricing")) {
        const pricing = document.getElementById("pricing");
        if (!pricing) return;

        event.preventDefault();
        event.stopPropagation();
        if (window.location.hash !== "#pricing") {
          history.pushState(null, "", "#pricing");
        }

        if (compactFlow) {
          pricing.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        scrollWithLenis(pricing);
        if (activeSlide === 0) {
          moveTo(1);
        }
        return;
      }

      if (href.includes("#products")) {
        const products = document.getElementById("products");
        if (!products) return;

        event.preventDefault();
        event.stopPropagation();
        if (window.location.hash !== "#products") {
          history.pushState(null, "", "#products");
        }

        if (compactFlow) {
          products.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        scrollWithLenis(products);
        if (activeSlide === 0) {
          moveTo(1);
        }
        return;
      }

      if (href.startsWith("#") && url.hash) {
        const target = document.getElementById(url.hash.slice(1));
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();
        if (window.location.hash !== url.hash) {
          history.pushState(null, "", url.hash);
        }

        if (compactFlow) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        if (activeSlide === 0) {
          pendingScroll.current = { target };
          moveTo(1);
        } else {
          scrollWithLenis(target);
        }
        return;
      }

      if (href === "/" || href === "/#") {
        event.preventDefault();
        event.stopPropagation();
        if (window.location.hash) {
          history.pushState(null, "", window.location.pathname);
        }
        goHome();
      }
    };

    window.addEventListener("hashchange", openAbout);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("hashchange", openAbout);
      document.removeEventListener("click", onClick, true);
    };
  });

  if (compactFlow) {
    return (
      <ParallaxAnimationCycleContext.Provider value={animationCycle}>
        <ParallaxActiveSlideContext.Provider value={headerSurfaceSlide}>
          {header}
          <main className="page-scroll-flow" aria-label="Основные разделы сайта">
            {slides.map((slide, index) => (
              <section key={index} className="page-scroll-section">
                <ParallaxEntryContext.Provider value={entryCounts[index] ?? 0}>
                  {slide}
                </ParallaxEntryContext.Provider>
              </section>
            ))}
          </main>
        </ParallaxActiveSlideContext.Provider>
      </ParallaxAnimationCycleContext.Provider>
    );
  }

  return (
    <ParallaxAnimationCycleContext.Provider value={animationCycle}>
      <ParallaxActiveSlideContext.Provider value={headerSurfaceSlide}>
        {header}
        <main className="hybrid-page-flow" aria-label="Основные разделы сайта">
        <div
          className="full-page-parallax"
          data-active-slide={activeSlide}
          onTouchStart={(event) => {
            if (window.scrollY <= INTRO_TOP_PX) {
              touchStartY.current = event.touches[0]?.clientY ?? null;
            }
          }}
          onTouchEnd={(event) => {
            const startY = touchStartY.current;
            const endY = event.changedTouches[0]?.clientY;
            touchStartY.current = null;
            if (
              startY === null ||
              endY === undefined ||
              window.scrollY > INTRO_TOP_PX
            ) {
              return;
            }

            const distance = startY - endY;
            if (Math.abs(distance) < SWIPE_THRESHOLD) return;
            if (distance > 0 && activeSlide === 0) moveTo(1);
            if (distance < 0 && activeSlide === 1) moveTo(0);
          }}
        >
          {introSlides.map((slide, index) => {
            const state =
              index < activeSlide
                ? "previous"
                : index === activeSlide
                  ? "active"
                  : "next";

            return (
              <section
                key={index}
                className="parallax-slide"
                data-state={state}
                aria-hidden={state !== "active"}
                inert={state !== "active"}
              >
                <ParallaxEntryContext.Provider value={entryCounts[index] ?? 0}>
                  <div className="parallax-slide-content">{slide}</div>
                </ParallaxEntryContext.Provider>
              </section>
            );
          })}
        </div>

        {regularSlides.map((slide, offset) => {
          const index = offset + INTRO_SLIDES;
          return (
            <section key={index} className="regular-scroll-section">
              <ParallaxEntryContext.Provider value={entryCounts[index] ?? 0}>
                {slide}
              </ParallaxEntryContext.Provider>
            </section>
          );
        })}
        </main>
      </ParallaxActiveSlideContext.Provider>
    </ParallaxAnimationCycleContext.Provider>
  );
}
