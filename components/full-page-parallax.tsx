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
import { UpwardScrollContext } from "./marketing-ui";

const ParallaxActiveSlideContext = createContext(0);

export function useParallaxActiveSlide() {
  return useContext(ParallaxActiveSlideContext);
}

// Sections follow normal document flow and only reveal on downward scrolling.
export function FullPageParallax({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  const slides = Children.toArray(children);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollingUp = useRef(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let frame = 0;
    let scrollY = Math.max(0, window.scrollY);

    const sync = () => {
      frame = 0;
      setActiveSection(hero.getBoundingClientRect().bottom <= 80 ? 1 : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    const onScroll = () => {
      const next = Math.max(0, window.scrollY);
      if (next !== scrollY) scrollingUp.current = next < scrollY;
      scrollY = next;
      schedule();
    };

    schedule();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(hero);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <ParallaxActiveSlideContext.Provider value={activeSection}>
      {header}
      <UpwardScrollContext.Provider value={scrollingUp}>
        <ClosingLayout>
          <main className="page-scroll-flow" aria-label="Основные разделы сайта">
            <div ref={heroRef} className="page-scroll-section" data-page-hero>
              <div className="page-scroll-hero-surface" data-header-surface="light">{slides[0]}</div>
            </div>
            {slides.slice(1).map((slide, index) => (
              <div key={index} className="page-scroll-section">{slide}</div>
            ))}
          </main>
        </ClosingLayout>
      </UpwardScrollContext.Provider>
    </ParallaxActiveSlideContext.Provider>
  );
}
