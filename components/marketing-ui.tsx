"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import { UiIcon } from "./ui-icon";

export function useMarketingReducedMotion() {
  return useHydratedReducedMotion();
}

type ScrollRevealOptions = {
  delay?: number;
  rows?: boolean;
  blur?: boolean;
  scaleIn?: boolean;
  after?: RefObject<HTMLElement | null>;
  sectionEntryViewportFraction?: number;
};

export const UpwardScrollContext = createContext<RefObject<boolean> | null>(null);

/**
 * Reveal offscreen groups once as the reader scrolls down.
 * Content already in view, focused, or reached while scrolling up is shown immediately.
 */
export function useScrollReveal<T extends HTMLElement>({
  delay = 0,
  rows = false,
  blur = true,
  scaleIn = false,
  after,
  sectionEntryViewportFraction = 0,
}: ScrollRevealOptions = {}) {
  const ref = useRef<T>(null);
  const revealed = useRef(new WeakSet<HTMLElement>());
  const [layoutRevision, setLayoutRevision] = useState(0);
  const reduced = useMarketingReducedMotion();
  const scrollingUp = useContext(UpwardScrollContext);

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
    const entranceEase = scaleIn
      ? "cubic-bezier(.26, .48, .32, 1)"
      : computedRoot.getPropertyValue("--entrance-fade-ease").trim() || "ease-out";
    const blurRadius = computedRoot.getPropertyValue("--entrance-blur").trim() || "1.5px";
    const entranceDuration = scaleIn
      ? 720
      : Number.parseFloat(computedRoot.getPropertyValue("--entrance-fade-duration")) || 600;
    const entranceStagger = Number.parseFloat(computedRoot.getPropertyValue("--entrance-fade-stagger")) || 100;
    const hasSurface = computedRoot.backgroundColor !== "rgba(0, 0, 0, 0)" ||
      Number.parseFloat(computedRoot.borderTopWidth) > 0;
    const children = Array.from(element.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    if (scaleIn) targets.push(element);
    else if (rows) targets.push(...children);
    else if (hasSurface || children.length === 0) collect(element);
    else children.forEach((child) => collect(child));

    type RevealTarget = { node: HTMLElement; opacity: number; filter: string };
    type RevealGroup = {
      targets: RevealTarget[];
      anchor: HTMLElement;
      order: number;
      phase: "waiting" | "entering" | "settled";
      animations: Animation[];
    };
    const groups: RevealGroup[] = [];
    const rowGroups = new Map<number, RevealGroup>();
    targets.forEach((target) => {
      const computed = getComputedStyle(target);
      const item: RevealTarget = {
        node: target,
        opacity: Number(computed.opacity),
        filter: computed.filter,
      };
      target.dataset.revealTarget = "";
      const row = Math.round(target.offsetTop);
      let group = rows ? rowGroups.get(row) : undefined;
      if (!group) {
        group = { targets: [], anchor: target, order: groups.length, phase: "waiting", animations: [] };
        groups.push(group);
        if (rows) rowGroups.set(row, group);
      }
      group.targets.push(item);
    });

    const states = new Map(groups.map((group) => [group.anchor, group]));
    const clearAnimations = (group: RevealGroup) => {
      group.animations.forEach((animation) => {
        animation.onfinish = null;
        animation.cancel();
      });
      group.animations = [];
    };
    const markRevealed = (group: RevealGroup, phase: "entering" | "settled") => {
      group.phase = phase;
      group.targets.forEach(({ node }) => {
        revealed.current.add(node);
        node.dataset.revealState = phase;
      });
    };
    const settle = (group: RevealGroup) => {
      clearAnimations(group);
      markRevealed(group, "settled");
    };
    const startFrame = (target: RevealTarget): Keyframe => ({
      opacity: 0,
      ...(scaleIn ? { scale: "0.92", translate: "0 12px" } : {}),
      ...(!scaleIn && blur && target.filter === "none" ? { filter: `blur(${blurRadius})` } : {}),
    });
    const prepare = (group: RevealGroup) => {
      // Prepare only offscreen. No visible -> hidden flash at the entry threshold.
      group.animations = group.targets.map((target) => {
        const frame = startFrame(target);
        const animation = target.node.animate([frame, frame], { duration: 1, fill: "both" });
        animation.pause();
        animation.currentTime = 0;
        target.node.dataset.revealState = "waiting";
        return animation;
      });
    };
    const play = (group: RevealGroup) => {
      if (group.phase !== "waiting") return;
      if (scrollingUp?.current || document.hidden || group.targets.some(({ node }) => node.closest("[inert]") ||
        node.contains(document.activeElement))) {
        settle(group);
        return;
      }
      clearAnimations(group);
      markRevealed(group, "entering");
      const sharedStart = document.timeline.currentTime;
      let remaining = group.targets.length;
      group.animations = group.targets.map((target) => {
        const from = startFrame(target);
        const to: Keyframe = {
          opacity: target.opacity,
          ...(scaleIn ? { scale: "1", translate: "0 0" } : {}),
          ...(from.filter ? { filter: "none" } : {}),
        };
        const animation = target.node.animate([from, to], {
          duration: entranceDuration,
          delay: Math.max(delay, 0) * 1000 + Math.min(group.order, 2) * entranceStagger,
          easing: entranceEase,
          fill: "both",
        });
        // Every logo in a visual row shares exactly the same animation clock.
        if (typeof sharedStart === "number") animation.startTime = sharedStart;
        animation.onfinish = () => {
          remaining -= 1;
          if (remaining > 0) return;
          settle(group);
        };
        return animation;
      });
    };

    groups.forEach((group) => {
      if (group.anchor.getBoundingClientRect().top < window.innerHeight ||
          group.targets.some(({ node }) => revealed.current.has(node) || node.contains(document.activeElement))) settle(group);
      else prepare(group);
    });

    const entrySection = sectionEntryViewportFraction > 0 ? element.closest("section") : null;
    const resizeEntry = Boolean(entrySection || scaleIn);
    let entryObserver: IntersectionObserver | undefined;
    const observeEntry = () => {
      entryObserver?.disconnect();
      // IntersectionObserver resolves percentage margins against the viewport width.
      const cardInset = scaleIn
        ? Number.parseFloat(getComputedStyle(element).getPropertyValue("--entrance-bottom-inset")) || 0
        : 0;
      const bottomInset = entrySection
        ? Math.round(window.innerHeight * sectionEntryViewportFraction)
        : Math.min(cardInset, Math.round(window.innerHeight * 0.4));
      const observer = new IntersectionObserver((entries) => {
        if (entryObserver !== observer) return;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entrySection) {
            groups.forEach(play);
          } else {
            const group = states.get(entry.target as HTMLElement);
            if (group) play(group);
          }
          observer.unobserve(entry.target);
        });
      }, { rootMargin: `0px 0px -${bottomInset}px 0px` });
      entryObserver = observer;
      if (entrySection) observer.observe(entrySection);
      else groups.forEach((group) => {
        if (group.phase === "waiting") observer.observe(group.anchor);
      });
    };
    const precedingElement = after?.current;
    let precedingObserver: MutationObserver | undefined;
    const startObserving = () => {
      const state = precedingElement?.dataset.revealState;
      if (state === "waiting" || state === "entering") return;
      precedingObserver?.disconnect();
      observeEntry();
    };
    if (precedingElement) {
      // Keep each card's own viewport trigger, but arm it only after the heading.
      precedingObserver = new MutationObserver(startObserving);
      precedingObserver.observe(precedingElement, { attributeFilter: ["data-reveal-state"] });
    }
    startObserving();
    if (resizeEntry) window.addEventListener("resize", startObserving);
    const settleAll = () => groups.forEach(settle);
    const onPointerDown = (event: PointerEvent) => {
      // A touch can start a scroll over a card that is still appearing.
      if (!scaleIn || event.pointerType !== "touch") settleAll();
    };
    const onVisibilityChange = () => {
      if (!document.hidden) return;
      if (scaleIn) groups.filter((group) => group.phase === "entering").forEach(settle);
      else settleAll();
    };
    element.addEventListener("focusin", settleAll);
    element.addEventListener("pointerdown", onPointerDown);
    if (scaleIn) element.addEventListener("click", settleAll);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      entryObserver?.disconnect();
      precedingObserver?.disconnect();
      if (resizeEntry) window.removeEventListener("resize", startObserving);
      groups.forEach(clearAnimations);
      element.removeEventListener("focusin", settleAll);
      element.removeEventListener("pointerdown", onPointerDown);
      if (scaleIn) element.removeEventListener("click", settleAll);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      targets.forEach((target) => {
        delete target.dataset.revealTarget;
        delete target.dataset.revealState;
      });
    };
  }, [delay, rows, blur, scaleIn, after, sectionEntryViewportFraction, layoutRevision, reduced, scrollingUp]);

  return ref;
}

export function SectionReveal({
  children,
  id,
  className,
  delay = 0,
  rows = false,
  blur = true,
  scaleIn = false,
  after,
  sectionEntryViewportFraction,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
} & ScrollRevealOptions) {
  const ref = useScrollReveal<HTMLDivElement>({ delay, rows, blur, scaleIn, after, sectionEntryViewportFraction });
  return <div ref={ref} id={id} className={className} data-scroll-reveal="">{children}</div>;
}

export function ArrowRight({ diagonal = false }: { diagonal?: boolean }) {
  return <UiIcon name={diagonal ? "arrow-up-right" : "arrow-right"} />;
}
