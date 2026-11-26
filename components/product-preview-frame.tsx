"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useScrollReveal } from "./marketing-ui";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import styles from "./product-preview-frame.module.css";

export type PreviewPhase = "waiting" | "playing" | "settled";

export const ProductCopyEntrance = createContext<RefObject<HTMLElement | null> | undefined>(undefined);

/** Keep a product illustration and the content on its screens on one reveal timeline. */
export function ProductPreviewScene({ label, className, children }: {
  label: string;
  className: string;
  children: ReactNode | ((phase: PreviewPhase) => ReactNode);
}) {
  const scene = useRef<HTMLElement>(null);
  const after = useContext(ProductCopyEntrance);
  const frame = useScrollReveal<HTMLDivElement>({ motion: "lift", blur: false, after, animateOnMount: true });
  const started = useRef(false);
  const [phase, setPhase] = useState<PreviewPhase>("waiting");
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
    const playbackTarget = root.querySelector<HTMLElement>("[data-preview-playback-target]");
    let visible = false;
    let checkFrame = 0;
    let timer = 0;
    const finish = () => {
      window.clearTimeout(timer);
      if (started.current) setPhase("settled");
    };
    const play = () => {
      if (started.current || !visible || document.hidden || surface.dataset.revealState !== "settled") return;
      const bounds = (playbackTarget ?? root).getBoundingClientRect();
      let sampleY = (Math.max(0, bounds.top) + Math.min(window.innerHeight, bounds.bottom)) / 2;
      if (playbackTarget) {
        // The illustration can enter well before its actual chat, especially below the mobile copy.
        sampleY = bounds.top + bounds.height / 2;
        const arrivedByAnchor = window.location.hash === `#${playbackTarget.dataset.previewPlaybackTarget}`;
        if (sampleY <= 0 || (!arrivedByAnchor && sampleY > window.innerHeight * .68)) return;
      }
      // A sticky card covered by the next product is still geometrically in view.
      const foreground = document.elementFromPoint(bounds.left + bounds.width * .4, sampleY);
      if (!root.contains(foreground)) return;
      started.current = true;
      setPhase("playing");
      timer = window.setTimeout(finish, 6000);
    };
    const queuePlay = () => {
      if (!started.current && visible && !checkFrame) {
        checkFrame = requestAnimationFrame(() => { checkFrame = 0; play(); });
      }
    };
    const threshold = playbackTarget ? .65 : .25;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= threshold;
      if (visible) play();
      else if (!playbackTarget || !entry.isIntersecting) finish();
    }, { threshold: [0, threshold] });
    const entrance = new MutationObserver(play);
    entrance.observe(surface, { attributes: true, attributeFilter: ["data-reveal-state"] });
    visibility.observe(playbackTarget ?? root);
    window.addEventListener("scroll", queuePlay, { passive: true });
    window.addEventListener("resize", queuePlay);
    window.addEventListener("hashchange", queuePlay);
    document.addEventListener("focusout", queuePlay);
    const onVisibilityChange = () => document.hidden ? finish() : play();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(checkFrame);
      window.removeEventListener("scroll", queuePlay);
      window.removeEventListener("resize", queuePlay);
      window.removeEventListener("hashchange", queuePlay);
      document.removeEventListener("focusout", queuePlay);
      visibility.disconnect();
      entrance.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [frame, reduced]);

  return <figure ref={scene} className={styles.preview} aria-label={label} data-preview-state={phase}>
    <div ref={frame} className={className} data-reveal-on-load="">
      {typeof children === "function" ? children(phase) : children}
    </div>
  </figure>;
}

export function ProductPreviewFrame({ title, label, children, device = "browser" }: {
  title: string;
  label: string;
  children: ReactNode | ((phase: PreviewPhase) => ReactNode);
  device?: "browser" | "tablet";
}) {
  return <ProductPreviewScene label={label} className={device === "tablet" ? styles.tablet : styles.window}>
    {(phase) => <>
      {device === "browser" && <div className={styles.chrome} aria-hidden="true">
        <span className={styles.lights}><i /><i /><i /></span>
        <span className={styles.title}>{title}</span>
        <span className={styles.windowIcon} />
      </div>}
      <div className={styles.screen}>{typeof children === "function" ? children(phase) : children}</div>
    </>}
  </ProductPreviewScene>;
}
