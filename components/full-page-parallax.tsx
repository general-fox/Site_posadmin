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

const ParallaxActiveSlideContext = createContext(0);

export function useParallaxActiveSlide() {
  return useContext(ParallaxActiveSlideContext);
}

// Sections follow normal document flow.
export function FullPageParallax({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  const slides = Children.toArray(children);
  const heroRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let frame = 0;

    const sync = () => {
      frame = 0;
      setActiveSection(hero.getBoundingClientRect().bottom <= 80 ? 1 : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
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
          <div ref={heroRef} className="page-scroll-section" data-page-hero>
            <div className="page-scroll-hero-surface" data-header-surface="light">{slides[0]}</div>
          </div>
          {slides.slice(1).map((slide, index) => (
            <div key={index} className="page-scroll-section">{slide}</div>
          ))}
        </main>
      </ClosingLayout>
    </ParallaxActiveSlideContext.Provider>
  );
}
