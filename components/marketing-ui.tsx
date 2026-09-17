"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

export function useMarketingReducedMotion() {
  return useHydratedReducedMotion();
}

type ScrollRevealOptions = {
  delay?: number;
  distance?: number;
  rows?: boolean;
};

/**
 * Progressive enhancement: content is visible in SSR and without JavaScript.
 * Text groups reveal in sequence; large compositions reveal their smaller parts.
 * Separate entry/exit boundaries prevent the animation from retriggering itself.
 * Never hide content already on screen or cancel an entrance at the viewport edge.
 */
export function useScrollReveal<T extends HTMLElement>({
  delay = 0,
  distance = 16,
  rows = false,
}: ScrollRevealOptions = {}) {
  const ref = useRef<T>(null);
  const visits = useRef(new WeakMap<HTMLElement, number>());
  const [layoutRevision, setLayoutRevision] = useState(0);
  const reduced = useMarketingReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!rows || !element || typeof ResizeObserver !== "function") return;
    const rowSignature = () => Array.from(element.children)
      .map((child) => child instanceof HTMLElement ? child.offsetTop : 0).join(",");
    let previous = rowSignature();
    const observer = new ResizeObserver(() => {
      const next = rowSignature();
      if (next !== previous) {
        previous = next;
        setLayoutRevision((revision) => revision + 1);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [rows]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.dataset.scrollReveal = "";
    element.dataset.revealState = "settled";
    if (
      reduced ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window) ||
      typeof element.animate !== "function"
    ) return;

    const targets: HTMLElement[] = [];
    const maximumHeight = Math.min(620, window.innerHeight * 0.85);
    const collect = (candidate: HTMLElement, depth = 0) => {
      if (candidate !== element && candidate.matches("[data-scroll-reveal]")) return;
      if (candidate.closest("[inert]") || getComputedStyle(candidate).visibility === "hidden") return;
      const hasOwnReveals = Boolean(candidate.querySelector("[data-scroll-reveal]"));
      const isLarge = candidate.offsetHeight > maximumHeight;
      if ((hasOwnReveals || isLarge) && depth < 3) {
        Array.from(candidate.children).forEach((child) => {
          if (child instanceof HTMLElement) collect(child, depth + 1);
        });
      } else if (!hasOwnReveals && candidate.getBoundingClientRect().height > 0) {
        targets.push(candidate);
      }
    };
    const computedRoot = getComputedStyle(element);
    const hasSurface = computedRoot.backgroundColor !== "rgba(0, 0, 0, 0)" ||
      Number.parseFloat(computedRoot.borderTopWidth) > 0;
    const children = Array.from(element.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    if (rows) targets.push(...children);
    else if (hasSurface || children.length === 0) collect(element);
    else children.forEach((child) => collect(child));

    type RevealTarget = { node: HTMLElement; opacity: number; canTranslate: boolean };
    type RevealGroup = {
      targets: RevealTarget[];
      anchor: HTMLElement;
      order: number;
      count: number;
      phase: "waiting" | "entering" | "settled";
      outside: boolean;
      returning: boolean;
      animations: Animation[];
    };
    const groups: RevealGroup[] = [];
    const rowGroups = new Map<number, RevealGroup>();
    targets.forEach((target) => {
      const computed = getComputedStyle(target);
      const positioned = (node: Element) => ["sticky", "fixed"].includes(getComputedStyle(node).position);
      const item: RevealTarget = {
        node: target,
        opacity: Number.parseFloat(computed.opacity) || 1,
        canTranslate: computed.translate === "none" && !positioned(target) &&
          !Array.from(target.querySelectorAll("*")).some(positioned),
      };
      target.dataset.revealTarget = "";
      target.dataset.revealVisits = String(visits.current.get(target) ?? 0);
      const row = Math.round(target.offsetTop);
      let group = rows ? rowGroups.get(row) : undefined;
      if (!group) {
        group = {
          targets: [], anchor: target, order: groups.length,
          count: 0, phase: "settled", outside: false, returning: false, animations: [],
        };
        groups.push(group);
        if (rows) rowGroups.set(row, group);
      }
      group.targets.push(item);
      group.count = Math.max(group.count, visits.current.get(target) ?? 0);
    });

    const states = new Map(groups.map((group) => [group.anchor, group]));
    const clearAnimations = (group: RevealGroup) => {
      group.animations.forEach((animation) => {
        animation.onfinish = null;
        animation.cancel();
      });
      group.animations = [];
    };
    const stamp = (group: RevealGroup) => {
      group.targets.forEach(({ node }) => {
        visits.current.set(node, group.count);
        node.dataset.revealVisits = String(group.count);
        node.dataset.revealState = group.phase;
      });
      element.dataset.revealVisits = String(Math.max(
        Number(element.dataset.revealVisits ?? 0), group.count,
      ));
    };
    const settle = (group: RevealGroup) => {
      clearAnimations(group);
      group.phase = "settled";
      group.count = Math.max(1, group.count);
      stamp(group);
    };
    const startFrame = (group: RevealGroup, target: RevealTarget): Keyframe => ({
      opacity: target.opacity * (group.returning ? 0.72 : 0),
      ...(!group.returning && distance > 0 && target.canTranslate
        ? { translate: `0 ${Math.min(distance, 14)}px` } : {}),
    });
    const prepare = (group: RevealGroup) => {
      clearAnimations(group);
      group.phase = "waiting";
      group.returning = group.count > 0 || group.anchor.getBoundingClientRect().bottom <= 0;
      // Prepare only offscreen. No visible -> hidden flash at the entry threshold.
      group.animations = group.targets.map((target) => {
        const frame = startFrame(group, target);
        const animation = target.node.animate([frame, frame], { duration: 1, fill: "both" });
        animation.pause();
        animation.currentTime = 0;
        target.node.dataset.revealState = "waiting";
        return animation;
      });
    };
    const play = (group: RevealGroup) => {
      if (group.phase !== "waiting") return;
      if (document.hidden || group.targets.some(({ node }) => node.closest("[inert]") ||
        node.contains(document.activeElement))) {
        settle(group);
        return;
      }
      clearAnimations(group);
      group.phase = "entering";
      group.count += 1;
      stamp(group);
      const sharedStart = document.timeline.currentTime;
      let remaining = group.targets.length;
      group.animations = group.targets.map((target) => {
        const from = startFrame(group, target);
        const to: Keyframe = { opacity: target.opacity, ...(from.translate ? { translate: "0 0" } : {}) };
        const animation = target.node.animate([from, to], {
          duration: group.returning ? 440 : 640,
          delay: group.returning ? 0 : Math.min(Math.max(delay, 0) * 1000 + group.order * 45, 120),
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        });
        // Every logo in a visual row shares exactly the same animation clock.
        if (typeof sharedStart === "number") animation.startTime = sharedStart;
        animation.onfinish = () => {
          remaining -= 1;
          if (remaining > 0) return;
          settle(group);
          if (group.outside) prepare(group);
        };
        return animation;
      });
    };

    groups.forEach((group) => {
      const bounds = group.anchor.getBoundingClientRect();
      if (bounds.bottom > 0 && bounds.top < window.innerHeight) settle(group);
      else prepare(group);
    });

    const entryObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const group = states.get(entry.target as HTMLElement);
        if (group && entry.isIntersecting) play(group);
        // Leaving the viewport never interrupts an entrance already in progress.
      });
    }, { threshold: 0 });
    const exitObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const group = states.get(entry.target as HTMLElement);
        if (!group) return;
        group.outside = !entry.isIntersecting;
        // 96px of hysteresis is larger than any entrance movement. Scrolling a few
        // pixels back and forth cannot rearm the animation or change its opacity.
        if (group.outside && (group.phase === "settled" ||
          (group.phase === "waiting" && !group.returning && entry.boundingClientRect.bottom <= 0))) {
          prepare(group);
        }
      });
    }, { rootMargin: "96px 0px", threshold: 0 });
    groups.forEach((group) => {
      entryObserver.observe(group.anchor);
      exitObserver.observe(group.anchor);
    });

    const settleAll = () => groups.forEach(settle);
    const onVisibilityChange = () => { if (document.hidden) settleAll(); };
    element.addEventListener("focusin", settleAll);
    element.addEventListener("pointerdown", settleAll);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      entryObserver.disconnect();
      exitObserver.disconnect();
      settleAll();
      element.removeEventListener("focusin", settleAll);
      element.removeEventListener("pointerdown", settleAll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      targets.forEach((target) => { delete target.dataset.revealTarget; });
    };
  }, [delay, distance, rows, layoutRevision, reduced]);

  return ref;
}

export function SectionReveal({
  children,
  className,
  delay = 0,
  distance = 16,
  rows = false,
}: {
  children: ReactNode;
  className?: string;
} & ScrollRevealOptions) {
  const ref = useScrollReveal<HTMLDivElement>({ delay, distance, rows });
  return <div ref={ref} className={className} data-scroll-reveal="">{children}</div>;
}

export function ArrowRight({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"} /></svg>;
}
