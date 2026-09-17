"use client";

import {
  Children,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ClosingLayout } from "./closing-layout";

const ParallaxEntryContext = createContext(0);
const ParallaxActiveSlideContext = createContext(0);

export function useParallaxEntry() {
  return useContext(ParallaxEntryContext);
}

export function useParallaxActiveSlide() {
  return useContext(ParallaxActiveSlideContext);
}

// The existing consumer API now uses ordinary document flow on every screen.
// Visibility only updates the menu and decorations; it never controls scrolling.
export function FullPageParallax({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  const slides = Children.toArray(children);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroWasOutside = useRef(false);
  const [activeSection, setActiveSection] = useState(0);
  const [heroEntry, setHeroEntry] = useState(0);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let frame = 0;

    const sync = () => {
      frame = 0;
      const bounds = hero.getBoundingClientRect();
      const bottom = bounds.bottom;
      setActiveSection(bottom <= 80 ? 1 : 0);
      // Arm only after a complete exit, then wait until the arc above the
      // title is visible again. Small reversals cannot keep resetting it.
      if (bottom <= 0 && !heroWasOutside.current) {
        heroWasOutside.current = true;
        hero.dataset.heroReplay = "pending";
      } else if (heroWasOutside.current && bottom >= Math.min(bounds.height, window.innerHeight) * 0.78) {
        heroWasOutside.current = false;
        delete hero.dataset.heroReplay;
        setHeroEntry((entry) => entry + 1);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    const measure = () => {
      hero.parentElement?.style.setProperty("--curtain-height", `${hero.offsetHeight}px`);
      schedule();
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(measure);
    observer.observe(hero);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <ParallaxActiveSlideContext.Provider value={activeSection}>
      {header}
      <ClosingLayout>
      <main className="page-scroll-flow" aria-label="Основные разделы сайта">
        <div className="hero-reveal-stage">
          <div ref={heroRef} className="page-scroll-section hero-curtain" data-hero-curtain>
            <ParallaxEntryContext.Provider value={heroEntry}>
              <div className="page-scroll-hero-surface" data-header-surface="dark">{slides[0]}</div>
            </ParallaxEntryContext.Provider>
          </div>
          <div className="hero-reveal-underlay" data-hero-underlay>
            <ParallaxEntryContext.Provider value={0}>{slides[1]}</ParallaxEntryContext.Provider>
          </div>
        </div>
        {slides.slice(2).map((slide, index) => (
          <div key={index} className="page-scroll-section">{slide}</div>
        ))}
      </main>
      </ClosingLayout>
    </ParallaxActiveSlideContext.Provider>
  );
}
