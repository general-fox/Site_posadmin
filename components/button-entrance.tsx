"use client";

import { useLayoutEffect, useRef } from "react";
import { cssTimeToMs } from "@/lib/css-time";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";

const controls = ':is(button, summary, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], [data-button-reveal]):not([data-button-reveal="off"])';
const siblingStagger = 150;
// Scale around the resting position, with one small overshoot and a soft landing.
// The independent scale property leaves each control's own transform intact.
const buttonEntranceFrames: Keyframe[] = [
  { scale: "0.76", filter: "opacity(0)", offset: 0, easing: "cubic-bezier(.2,.65,.28,1)" },
  { scale: "1.025", filter: "opacity(1)", offset: 0.67, easing: "cubic-bezier(.4,0,.35,1)" },
  { scale: "1", filter: "opacity(1)", offset: 1 },
];
const fadeEntranceFrames: Keyframe[] = [
  { filter: "opacity(0)" },
  { filter: "opacity(1)" },
];

type Entrance = {
  phase: "waiting" | "entering" | "settled";
  animation: Animation | null;
  readyAt: number;
  inView: boolean;
};

/** Reveal neighbouring controls in reading order, independently of other groups. */
export function ButtonEntrance() {
  const reduced = useHydratedReducedMotion();
  const seen = useRef(new WeakSet<HTMLElement>());

  useLayoutEffect(() => {
    const entries = new Map<HTMLElement, Entrance>();
    const nextSiblingStart = new WeakMap<HTMLElement, number>();
    let frame = 0;
    let timer = 0;
    let disposed = false;
    const supported = typeof IntersectionObserver === "function" && typeof HTMLElement.prototype.animate === "function";
    const observer = supported ? new IntersectionObserver((changes) => {
      changes.forEach((change) => {
        const entry = entries.get(change.target as HTMLElement);
        if (entry) entry.inView = change.isIntersecting;
      });
      queueCheck();
    }, { rootMargin: "0px 0px -12px 0px" }) : null;

    function settle(node: HTMLElement, entry: Entrance) {
      entry.animation?.cancel();
      entry.animation = null;
      entry.phase = "settled";
      node.dataset.buttonEntrance = "settled";
      seen.current.add(node);
      observer?.unobserve(node);
    }

    function register(root: Element) {
      const nodes = [...(root.matches(controls) ? [root] : []), ...root.querySelectorAll(controls)];
      nodes.forEach((node) => {
        if (!(node instanceof HTMLElement) || entries.has(node)) return;
        const entry: Entrance = { phase: "waiting", animation: null, readyAt: 0, inView: false };
        entries.set(node, entry);
        if (reduced || !supported || seen.current.has(node)) settle(node, entry);
        else {
          // Honour any entrance delay already set by the component.
          const css = getComputedStyle(node);
          const cssDelay = css.animationName === "none" ? 0
            : Math.max(...css.animationDelay.split(",").map(value => cssTimeToMs(value)));
          entry.readyAt = performance.now() + Math.max(0, cssDelay);
          node.dataset.buttonEntrance = "waiting";
          observer?.observe(node);
        }
      });
    }

    function hidden(node: HTMLElement) {
      if (node.closest('[hidden], [inert], [aria-hidden="true"], dialog:not([open])')) return true;
      for (let details = node.closest("details:not([open])"); details; details = details.parentElement?.closest("details:not([open])") ?? null) {
        if (!details.querySelector(":scope > summary")?.contains(node)) return true;
      }
      const css = getComputedStyle(node);
      return !node.getClientRects().length || css.display === "none" || css.visibility === "hidden";
    }

    function dependencyTime(node: HTMLElement) {
      let readyAt = 0;
      for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) {
        if (parent.dataset.revealState === "waiting") return null;
        if (parent.dataset.revealState === "entering") {
          const started = Number(parent.dataset.revealStartedAt);
          if (Number.isFinite(started)) readyAt = Math.max(readyAt, started + 140);
        }
      }
      return readyAt;
    }

    function check() {
      frame = 0;
      window.clearTimeout(timer);
      if (disposed) return;
      const now = performance.now();
      let earliest = Infinity;
      entries.forEach((entry, node) => {
        if (!node.isConnected) {
          entry.animation?.cancel();
          observer?.unobserve(node);
          entries.delete(node);
          return;
        }
        if (entry.phase === "settled") return;
        if (node.closest("[data-step-return]") && !node.closest("[inert]")) { settle(node, entry); return; }
        if (entry.phase !== "waiting" || document.hidden || !entry.inView) return;
        const bounds = node.getBoundingClientRect();
        if (!bounds.width || !bounds.height || bounds.bottom <= 0 || bounds.top >= window.innerHeight - 12 || bounds.right <= 0 || bounds.left >= window.innerWidth) return;
        if (hidden(node)) return;
        if (node.matches(":focus-visible") || node.querySelector(":focus-visible")) { settle(node, entry); return; }
        const dependency = dependencyTime(node);
        if (dependency === null) return;
        const readyAt = Math.max(entry.readyAt, dependency);
        if (readyAt > now) { earliest = Math.min(earliest, readyAt); return; }
        entry.phase = "entering";
        node.dataset.buttonEntrance = "entering";
        const parent = node.parentElement!;
        const start = Math.max(now, nextSiblingStart.get(parent) ?? 0);
        nextSiblingStart.set(parent, start + siblingStagger);
        const fadeOnly = Boolean(node.closest('[data-button-motion="fade"]'));
        const animation = node.animate(fadeOnly ? fadeEntranceFrames : buttonEntranceFrames, {
          duration: fadeOnly ? 380 : 540,
          easing: fadeOnly ? "ease-out" : "linear",
          delay: start - now,
          fill: "both",
        });
        entry.animation = animation;
        animation.finished.then(() => {
          if (!disposed && entry.animation === animation) settle(node, entry);
        }).catch(() => { /* Focus, reduced motion or unmount can finish early. */ });
        observer?.unobserve(node);
      });
      if (Number.isFinite(earliest)) timer = window.setTimeout(queueCheck, Math.max(0, earliest - performance.now()) + 1);
    }

    function queueCheck() {
      if (!disposed && !frame) frame = requestAnimationFrame(check);
    }

    const mutations = new MutationObserver((changes) => {
      changes.forEach((change) => {
        if (change.type === "childList") change.addedNodes.forEach((node) => { if (node instanceof Element) register(node); });
        if (change.type === "attributes" && change.attributeName === "data-button-reveal" && change.target instanceof HTMLElement) {
          const node = change.target;
          if (node.dataset.buttonReveal === "off") {
            entries.get(node)?.animation?.cancel();
            entries.delete(node);
            observer?.unobserve(node);
            delete node.dataset.buttonEntrance;
          } else register(node);
        }
      });
      queueCheck();
    });
    register(document.body);
    mutations.observe(document.body, {
      subtree: true, childList: true, attributes: true,
      // Never observe style or our own markers: scrolling visuals update those
      // continuously. These attributes cover dialogs, steps and disclosure UI.
      attributeFilter: ["open", "inert", "hidden", "aria-hidden", "data-visible", "data-reveal-state", "data-reveal-started-at", "data-button-reveal"],
    });

    const finishInteraction = (event: Event) => {
      const source = event.target instanceof Element ? event.target : null;
      const target = source?.closest<HTMLElement>(controls);
      if (!target || (event.type === "focusin" && !source?.matches(":focus-visible"))) return;
      const entry = entries.get(target);
      if (entry && entry.phase !== "settled") settle(target, entry);
    };
    const visibilityChange = () => {
      if (document.hidden) entries.forEach((entry, node) => { if (entry.phase === "entering") settle(node, entry); });
      else queueCheck();
    };
    window.addEventListener("scroll", queueCheck, { passive: true });
    window.addEventListener("resize", queueCheck);
    document.addEventListener("focusin", finishInteraction);
    document.addEventListener("focusout", queueCheck);
    document.addEventListener("click", finishInteraction);
    document.addEventListener("visibilitychange", visibilityChange);
    queueCheck();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      observer?.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", queueCheck);
      window.removeEventListener("resize", queueCheck);
      document.removeEventListener("focusin", finishInteraction);
      document.removeEventListener("focusout", queueCheck);
      document.removeEventListener("click", finishInteraction);
      document.removeEventListener("visibilitychange", visibilityChange);
      entries.forEach((entry, node) => {
        entry.animation?.cancel();
        node.dataset.buttonEntrance = "settled";
      });
    };
  }, [reduced]);

  return null;
}
