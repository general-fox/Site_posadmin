"use client";

import { Children, cloneElement, isValidElement, useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import { cssTimeToMs } from "@/lib/css-time";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import { UiIcon } from "./ui-icon";

export function useMarketingReducedMotion() {
  return useHydratedReducedMotion();
}

type ScrollRevealOptions = {
  delay?: number;
  rows?: boolean;
  sequence?: boolean;
  // Media opts in explicitly; large card surfaces stay sharp by default.
  blur?: boolean | "media";
  motion?: "fade" | "lift" | "scale";
  after?: RefObject<HTMLElement | null>;
  active?: boolean;
  animateOnMount?: boolean;
};

type TextProps = {
  children?: ReactNode;
  className?: string;
  "data-reveal-word"?: string;
  "data-reveal-line-word"?: string;
};

function splitWords(children: ReactNode, lines = false): ReactNode {
  const marker = lines ? { "data-reveal-line-word": "" } : { "data-reveal-word": "" };
  return Children.map(children, (child) => {
    if (typeof child === "string" || typeof child === "number") {
      // Keep nonbreaking spaces inside one unit so they still prevent line wrapping.
      // Breakable spaces remain text nodes, preserving the accessible reading order.
      return String(child).split(/([^\S\u00a0\u202f\ufeff]+)/u).map((word, index) => /^[^\S\u00a0\u202f\ufeff]*$/u.test(word)
        ? word : <span key={index} {...marker}>{word}</span>);
    }
    if (!isValidElement<TextProps>(child)) return child;
    if (child.type === RevealWords || child.type === RevealLines ||
      child.props["data-reveal-word"] !== undefined || child.props["data-reveal-line-word"] !== undefined ||
      child.props.className?.includes("sr-only")) return child;
    if (child.type === "br") return child;
    if (typeof child.type !== "string" || child.type === "svg") return <span {...marker}>{child}</span>;
    return cloneElement(child, {}, splitWords(child.props.children, lines));
  });
}

export function RevealWords({ children }: { children: ReactNode }) {
  return <>{splitWords(children)}</>;
}

export function RevealLines({ children }: { children: ReactNode }) {
  // One inline container also keeps flex paragraphs from making every word a flex item.
  return <span data-reveal-lines="">{splitWords(children, true)}</span>;
}

function prepareHeadings(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<TextProps>(child) || typeof child.type !== "string") return child;
    if (/^h[1-6]$/.test(child.type)) return cloneElement(child, {}, <RevealWords>{child.props.children}</RevealWords>);
    if (child.type === "p") return cloneElement(child, {}, <RevealLines>{child.props.children}</RevealLines>);
    return child.props.children ? cloneElement(child, {}, prepareHeadings(child.props.children)) : child;
  });
}

/** One-shot entrances. Resize, reverse scroll and surface touches never restart them. */
export function useScrollReveal<T extends HTMLElement>({
  delay = 0, rows = false, sequence = false, blur = true, motion = "fade",
  after, active = true, animateOnMount = false,
}: ScrollRevealOptions = {}) {
  const ref = useRef<T>(null);
  const revealed = useRef(new WeakSet<HTMLElement>());
  const reduced = useMarketingReducedMotion();

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !active) return;
    element.dataset.scrollReveal = "";
    element.dataset.revealState = "settled";
    if (reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window) || typeof element.animate !== "function") return;

    const rootStyle = getComputedStyle(element);
    const scaleIn = motion === "scale";
    const readNumber = (name: string, fallback: number) => {
      const value = Number.parseFloat(rootStyle.getPropertyValue(name));
      return Number.isFinite(value) ? value : fallback;
    };
    const readTime = (name: string, fallback: number) => cssTimeToMs(rootStyle.getPropertyValue(name), fallback);
    const duration = readTime("--entrance-fade-duration", 700);
    const stagger = readTime("--entrance-fade-stagger", 90);
    const distance = readNumber("--entrance-distance", window.innerWidth < 768 ? 8 : 10);
    const textDuration = readTime("--entrance-text-duration", 800);
    const wordStagger = readTime("--entrance-word-stagger", 90);
    const lineStagger = readTime("--entrance-line-stagger", 100);
    const textDistance = readNumber("--entrance-text-distance", window.innerWidth < 768 ? 8 : 12);
    const blurRadius = rootStyle.getPropertyValue("--entrance-text-blur").trim() || "5px";
    const easing = rootStyle.getPropertyValue("--entrance-fade-ease").trim() || "cubic-bezier(.22, .61, .36, 1)";
    const advance = readNumber("--entrance-advance", 48);
    const baseDelay = Math.max(0, delay * 1000 + readTime("--entrance-delay", 0));
    const preceding = after?.current;
    const targets: HTMLElement[] = [];
    const collect = (candidate: HTMLElement, depth = 0) => {
      if (candidate !== element && candidate.matches("[data-scroll-reveal]")) return;
      if (candidate.closest("[inert]") || getComputedStyle(candidate).visibility === "hidden") return;
      const ownReveals = Boolean(candidate.querySelector("[data-scroll-reveal]"));
      const large = candidate.offsetHeight > Math.min(620, window.innerHeight * 0.85);
      if ((ownReveals || large) && depth < 3) {
        Array.from(candidate.children).forEach((child) => {
          if (child instanceof HTMLElement) collect(child, depth + 1);
        });
      } else if (!ownReveals && candidate.getBoundingClientRect().height > 0) targets.push(candidate);
    };
    const children = Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    const surface = rootStyle.backgroundColor !== "rgba(0, 0, 0, 0)" || Number.parseFloat(rootStyle.borderTopWidth) > 0;
    if (sequence) {
      const marked = Array.from(element.querySelectorAll<HTMLElement>("[data-reveal-item], [data-stage-entry]"));
      targets.push(...marked.filter((node) => !node.closest("[inert]") && !marked.some((parent) => parent !== node && parent.contains(node))));
    } else if (motion !== "fade" || rows) targets.push(...(rows ? children : [element]));
    else if (element.matches("h1,h2,h3,h4,h5,h6,p") || surface || children.length === 0) collect(element);
    else children.forEach((child) => collect(child));

    type Unit = { node: HTMLElement; opacity: string; filter: string; translate: string; word: number; text: boolean; control: boolean };
    type Group = {
      anchor: HTMLElement;
      units: Unit[];
      textMode: "words" | "lines" | null;
      phase: "waiting" | "entering" | "settled";
      animations: Animation[];
    };
    const controlSelector = "button,summary,[role='button'],input[type='button'],input[type='submit'],input[type='reset'],[data-button-reveal]";
    const groups: Group[] = targets.map((anchor) => {
      // Text splits only when it is a target, never inside an independently moving card.
      const control = anchor.matches(controlSelector) || anchor.hasAttribute("data-button-group");
      const textMode = control ? null : anchor.matches("h1,h2,h3,h4,h5,h6") ? "words" : anchor.matches("p") ? "lines" : null;
      const words = textMode ? Array.from(anchor.querySelectorAll<HTMLElement>(textMode === "words" ? "[data-reveal-word]" : "[data-reveal-line-word]")) : [];
      anchor.dataset.revealTarget = "";
      return {
        anchor, textMode, phase: "waiting", animations: [],
        units: (words.length ? words : [anchor]).map((node, word) => {
          const css = getComputedStyle(node);
          return { node, word, opacity: css.opacity, filter: css.filter, translate: css.translate, text: textMode !== null, control };
        }),
      };
    });
    let disposed = false;
    let frame = 0;
    let timer = 0;
    let sequenceStart = 0;
    const observer = new IntersectionObserver(queueCheck, { rootMargin: `0px 0px ${advance}px 0px` });
    const publish = () => {
      if (targets.includes(element)) return;
      element.dataset.revealState = groups.every((group) => group.phase === "settled") ? "settled"
        : groups.some((group) => group.phase !== "waiting") ? "entering" : "waiting";
    };
    const clear = (group: Group) => {
      group.animations.forEach((animation) => { animation.onfinish = null; animation.cancel(); });
      group.animations = [];
    };
    const settle = (group: Group) => {
      clear(group);
      group.phase = "settled";
      revealed.current.add(group.anchor);
      group.anchor.dataset.revealState = "settled";
      observer?.unobserve(group.anchor);
      publish();
    };
    const firstFrame = (unit: Unit): Keyframe => ({
      opacity: 0,
      ...(!unit.control ? { translate: `0 ${unit.text ? textDistance : distance}px` } : {}),
      ...(scaleIn && !unit.control ? { scale: "0.92" } : {}),
      ...(blur && !unit.control && (unit.text || blur === "media") && unit.filter === "none" ? { filter: `blur(${blurRadius})` } : {}),
    });
    const prepare = (group: Group) => {
      group.anchor.dataset.revealState = "waiting";
      group.animations = group.units.map((unit) => {
        const from = firstFrame(unit);
        const animation = unit.node.animate([from, from], { duration: 1, fill: "both" });
        animation.pause();
        animation.currentTime = 0;
        return animation;
      });
    };
    const keyboardFocused = (anchor: HTMLElement) => {
      const focused = document.activeElement;
      return focused instanceof Element && anchor.contains(focused) && focused.matches(":focus-visible");
    };
    const play = (group: Group, wait: number) => {
      if (group.phase !== "waiting") return;
      if (document.hidden || keyboardFocused(group.anchor)) { settle(group); return; }
      clear(group);
      group.phase = "entering";
      revealed.current.add(group.anchor);
      const startsAt = performance.now() + wait;
      group.anchor.dataset.revealStartedAt = String(startsAt);
      group.anchor.dataset.revealState = "entering";
      if (!element.dataset.revealStartedAt) element.dataset.revealStartedAt = String(startsAt);
      publish();
      // Measure at play time: a waiting paragraph may have wrapped differently after resize.
      // Offset coordinates ignore the temporary reveal translate and share a document origin.
      const lineTops = group.textMode === "lines" ? group.units.map(({ node }) => {
        let top = 0;
        let current: HTMLElement | null = node;
        while (current) {
          top += current.offsetTop;
          current = current.offsetParent instanceof HTMLElement ? current.offsetParent : null;
        }
        return top;
      }) : [];
      const lineOrder = new Map(Array.from(new Set(lineTops)).sort((a, b) => a - b).map((top, index) => [top, index]));
      let remaining = group.units.length;
      group.animations = group.units.map((unit) => {
        const from = firstFrame(unit);
        const textDelay = group.textMode === "lines" ? (lineOrder.get(lineTops[unit.word]) ?? 0) * lineStagger
          : group.textMode === "words" ? unit.word * wordStagger : 0;
        const animation = unit.node.animate([from, {
          opacity: unit.opacity,
          ...(from.translate ? { translate: unit.translate } : {}),
          ...(from.scale ? { scale: "1" } : {}),
          ...(from.filter ? { filter: unit.filter } : {}),
        }], { duration: unit.text ? textDuration : duration, delay: wait + textDelay, easing, fill: "both" });
        animation.onfinish = () => { if (--remaining === 0) settle(group); };
        return animation;
      });
      observer?.unobserve(group.anchor);
    };
    const dependencyWait = () => {
      if (!preceding || preceding.dataset.revealState === "settled") return 0;
      // A fast scroll may skip the preceding heading's observer region entirely.
      if (preceding.getBoundingClientRect().bottom <= 0) return 0;
      if (preceding.dataset.revealState !== "entering") return null;
      const started = Number(preceding.dataset.revealStartedAt);
      // A sequence can already contain visible items without having animated.
      // Don't keep extending a dependency timeout when it has no start clock.
      return Number.isFinite(started) ? Math.max(0, started + 140 - performance.now()) : 0;
    };
    const check = () => {
      frame = 0;
      if (disposed) return;
      window.clearTimeout(timer);
      const now = performance.now();
      const wait = dependencyWait();
      let needsDependencyTimer = false;
      let batchIndex = 0;
      const rowDelays = new Map<number, number>();
      const pending = groups.filter(group => group.phase === "waiting").map(group => ({
        group, bounds: group.anchor.getBoundingClientRect(),
      }));
      if (sequence) pending.sort((a, b) =>
        Math.round(a.bounds.top) - Math.round(b.bounds.top) || a.bounds.left - b.bounds.left);
      pending.forEach(({ group, bounds }) => {
        if (bounds.bottom <= 0) { settle(group); return; }
        if (bounds.top > window.innerHeight + advance || group.anchor.closest("[inert]")) return;
        if (wait === null) return;
        if (wait > 0) { needsDependencyTimer = true; return; }
        let itemDelay: number;
        if (rows) {
          const row = Math.round(group.anchor.offsetTop);
          if (!rowDelays.has(row)) rowDelays.set(row, Math.min(batchIndex++, 2) * stagger);
          itemDelay = rowDelays.get(row)!;
        } else {
          // Every visible item in an explicit sequence gets its own start time.
          const start = sequence ? Math.max(now, sequenceStart)
            : Math.min(Math.max(now, sequenceStart), now + stagger * 2);
          itemDelay = start - now;
          sequenceStart = start + stagger;
        }
        play(group, baseDelay + itemDelay);
      });
      if (needsDependencyTimer && wait !== null) timer = window.setTimeout(queueCheck, wait + 1);
    };
    function queueCheck() {
      if (!disposed && !frame && groups.some((group) => group.phase === "waiting")) frame = requestAnimationFrame(check);
    }

    groups.forEach((group) => {
      const visible = group.anchor.getBoundingClientRect().top < window.innerHeight;
      const waitingForHeading = preceding && preceding.dataset.revealState && preceding.dataset.revealState !== "settled";
      if (revealed.current.has(group.anchor) || keyboardFocused(group.anchor) ||
        (visible && !animateOnMount && !waitingForHeading)) settle(group);
      else prepare(group);
    });
    publish();
    groups.filter((group) => group.phase === "waiting").forEach((group) => observer.observe(group.anchor));
    const precedingObserver = preceding ? new MutationObserver(queueCheck) : null;
    if (preceding) precedingObserver?.observe(preceding, { attributeFilter: ["data-reveal-state", "data-reveal-started-at"] });

    const settleInteraction = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const keyboard = event.type === "focusin" && target.matches(":focus-visible");
      const activated = event.type === "click" && target.closest("a[href],button,input,select,textarea,summary,[role='button'],[role='link']");
      if (!keyboard && !activated) return;
      groups.filter((group) => group.anchor.contains(target)).forEach(settle);
    };
    const onVisibilityChange = () => {
      if (document.hidden) groups.filter((group) => group.phase === "entering").forEach(settle);
      else queueCheck();
    };
    // Fallback for scrolls that cross a whole observer region in a single frame.
    window.addEventListener("scroll", queueCheck, { passive: true });
    window.addEventListener("resize", queueCheck);
    element.addEventListener("focusin", settleInteraction);
    element.addEventListener("click", settleInteraction);
    document.addEventListener("visibilitychange", onVisibilityChange);
    queueCheck();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      observer?.disconnect();
      precedingObserver?.disconnect();
      groups.forEach(clear);
      window.removeEventListener("scroll", queueCheck);
      window.removeEventListener("resize", queueCheck);
      element.removeEventListener("focusin", settleInteraction);
      element.removeEventListener("click", settleInteraction);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      targets.forEach((target) => {
        delete target.dataset.revealTarget;
        delete target.dataset.revealState;
        delete target.dataset.revealStartedAt;
      });
      delete element.dataset.revealStartedAt;
    };
  }, [active, animateOnMount, after, blur, delay, motion, reduced, rows, sequence]);

  return ref;
}

export function SectionReveal({
  children, id, className, ...options
}: { children: ReactNode; id?: string; className?: string } & ScrollRevealOptions) {
  const ref = useScrollReveal<HTMLDivElement>(options);
  return <div ref={ref} id={id} className={className} data-scroll-reveal="">{prepareHeadings(children)}</div>;
}

export function ArrowRight({ diagonal = false }: { diagonal?: boolean }) {
  return <UiIcon name={diagonal ? "arrow-up-right" : "arrow-right"} />;
}
