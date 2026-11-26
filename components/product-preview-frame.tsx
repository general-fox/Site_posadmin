"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useScrollReveal } from "./marketing-ui";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import styles from "./product-preview-frame.module.css";

/** A shared, front-facing product window with a single short demonstration. */
export function ProductPreviewFrame({ title, label, children }: {
  title: string;
  label: string;
  children: ReactNode;
}) {
  const scene = useRef<HTMLElement>(null);
  const frame = useScrollReveal<HTMLDivElement>({ motion: "lift", blur: false, animateOnMount: true });
  const started = useRef(false);
  const [phase, setPhase] = useState<"waiting" | "playing" | "settled">("waiting");
  const reduced = useHydratedReducedMotion();

  useEffect(() => {
    const root = scene.current;
    const surface = frame.current;
    if (!root || !surface) return;
    if (started.current || reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver !== "function") {
      started.current = true;
      setPhase("settled");
      return;
    }
    let visible = false;
    let timer = 0;
    const finish = () => {
      window.clearTimeout(timer);
      if (started.current) setPhase("settled");
    };
    const play = () => {
      if (started.current || !visible || document.hidden || surface.dataset.revealState !== "settled") return;
      started.current = true;
      setPhase("playing");
      timer = window.setTimeout(finish, 6000);
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .25;
      if (!visible) finish();
      else play();
    }, { threshold: [0, .25] });
    const entrance = new MutationObserver(play);
    entrance.observe(surface, { attributes: true, attributeFilter: ["data-reveal-state"] });
    visibility.observe(root);
    const onVisibilityChange = () => document.hidden ? finish() : play();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(timer);
      visibility.disconnect();
      entrance.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [frame, reduced]);

  return <figure ref={scene} className={styles.preview} aria-label={label} data-preview-state={phase}>
    <div ref={frame} className={styles.window} data-reveal-on-load="">
      <div className={styles.chrome} aria-hidden="true">
        <span className={styles.lights}><i /><i /><i /></span>
        <span className={styles.title}>{title}</span>
        <span className={styles.windowIcon} />
      </div>
      <div className={styles.screen}>{children}</div>
    </div>
  </figure>;
}
