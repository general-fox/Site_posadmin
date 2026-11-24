"use client";

import { springValue } from "framer-motion";
import { useEffect, useRef } from "react";

function trackRetreat(element: HTMLElement, isCard: boolean) {
  const property = isCard ? "--product-card-progress" : "--product-scroll-progress";
  const measure = () => {
    const rect = element.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const viewportHeight = window.innerHeight;
    const trigger = isCard
      ? top + rect.height / 2 - viewportHeight * 0.8
      : top - viewportHeight + 48;
    return Math.max(8, trigger);
  };
  let threshold = measure();
  let open = window.scrollY >= threshold;
  const spring = springValue<number>(open ? 1 : 0, { stiffness: 60, damping: 16, mass: 1 });
  const paint = (value: number) => element.style.setProperty(property, value.toFixed(4));
  const unsubscribe = spring.on("change", paint);
  paint(spring.get());

  return {
    measure() { threshold = measure(); },
    update(scroll: number) {
      // Reversing a few pixels near the trigger should not flicker the preview.
      const next = scroll >= (isCard && open ? Math.max(4, threshold - 14) : threshold);
      if (next === open) return;
      open = next;
      spring.set(open ? 1 : 0);
    },
    dispose() {
      unsubscribe();
      spring.destroy();
      element.style.removeProperty(property);
    },
  };
}

export function useHeroProductMotion(reduced: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scene = ref.current;
    if (!scene || reduced) return;

    const mobile = window.matchMedia("(max-width: 767px)");
    const slots = Array.from(scene.querySelectorAll<HTMLElement>("[data-product-motion-card]"));
    const sceneMotion = trackRetreat(scene, false);
    const mobileTracks = () => mobile.matches ? slots.map(slot => trackRetreat(slot, true)) : [];
    let cards = mobileTracks();

    const update = () => {
      const scroll = window.scrollY;
      sceneMotion.update(scroll);
      cards.forEach(card => card.update(scroll));
    };
    const measure = () => {
      sceneMotion.measure();
      cards.forEach(card => card.measure());
      update();
    };
    const changeLayout = () => {
      cards.forEach(card => card.dispose());
      cards = mobileTracks();
      measure();
    };

    const observer = new ResizeObserver(measure);
    observer.observe(scene.parentElement ?? scene);
    slots.forEach(slot => observer.observe(slot));
    mobile.addEventListener("change", changeLayout);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      mobile.removeEventListener("change", changeLayout);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", update);
      sceneMotion.dispose();
      cards.forEach(card => card.dispose());
    };
  }, [reduced]);

  return ref;
}
