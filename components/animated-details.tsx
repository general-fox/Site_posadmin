"use client";

import { Children, cloneElement, isValidElement, useEffect, useImperativeHandle, useRef, type ComponentPropsWithRef, type ReactNode } from "react";
import { prepareDisclosureScroll } from "@/lib/scroll-to-panel";
import { RevealLines } from "./marketing-ui";
import styles from "./animated-details.module.css";

type Props = ComponentPropsWithRef<"details"> & {
  keepStartVisible?: boolean;
  clipClassName?: string;
  bodyClassName?: string;
};
type ContentProps = {
  children?: ReactNode;
  className?: string;
  "data-answer-item"?: string;
  "data-answer-link"?: string;
};
const closePanel = new WeakMap<HTMLDetailsElement, () => void>();

export function closeAnimatedDetails(details: HTMLDetailsElement) {
  const close = closePanel.get(details);
  if (close) close();
  else details.open = false;
}

function prepareContent(content: ReactNode): ReactNode {
  return Children.map(content, child => {
    if (typeof child === "string" || typeof child === "number") return <RevealLines>{child}</RevealLines>;
    if (!isValidElement<ContentProps>(child) || child.props.className?.includes("sr-only") ||
      child.props["data-answer-item"] !== undefined || child.props["data-answer-link"] !== undefined) return child;
    if (typeof child.type === "string" && /^(input|textarea|select|button|code|svg)$/.test(child.type)) {
      return cloneElement(child, { "data-answer-item": "" });
    }
    return child.props.children ? cloneElement(child, {}, prepareContent(child.props.children)) : child;
  });
}

// Adjacent words in different inline elements still belong to the same visual line.
function numberLines(body: HTMLElement) {
  const units = Array.from(body.querySelectorAll<HTMLElement>("[data-reveal-line-word], [data-answer-link], [data-answer-item]"))
    .map(node => ({ node, top: node.getBoundingClientRect().top }))
    .sort((a, b) => a.top - b.top);
  let previous = -Infinity;
  let line = -1;
  for (const { node, top } of units) {
    if (top - previous > 4) { previous = top; line++; }
    node.style.setProperty("--answer-line", String(line));
  }
}

/** Animated on activation; native details and their form contents work before hydration. */
export function AnimatedDetails({ ref, children, keepStartVisible = false, clipClassName, bodyClassName, name, ...props }: Props) {
  const element = useRef<HTMLDetailsElement>(null);
  useImperativeHandle(ref, () => element.current!, []);
  useEffect(() => {
    const details = element.current!;
    const clip = details.querySelector<HTMLElement>(":scope > [data-answer-clip]")!;
    const body = clip.firstElementChild as HTMLElement;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let expansion: Animation | null = null;
    let fade: Animation | null = null;
    let resize: ResizeObserver | null = null;
    let readingScroll: ReturnType<typeof prepareDisclosureScroll>;

    function stop() {
      resize?.disconnect();
      expansion?.cancel();
      fade?.cancel();
      expansion = fade = null;
    }
    function move(open: boolean) {
      const from = details.open ? clip.offsetHeight : 0;
      const opacity = getComputedStyle(body).opacity;
      stop();
      readingScroll?.cancel();
      readingScroll = open && keepStartVisible ? prepareDisclosureScroll(details, body) : undefined;
      if (open) {
        if (name) {
          for (const sibling of document.querySelectorAll<HTMLDetailsElement>("details[open][name]")) {
            if (sibling !== details && sibling.getAttribute("name") === name) closeAnimatedDetails(sibling);
          }
          details.setAttribute("name", name);
        }
        details.open = true;
        delete details.dataset.answerLines;
      } else if (name) {
        // Keep the outgoing content rendered while its exclusive sibling opens.
        details.removeAttribute("name");
      }
      details.dataset.answerMotion = open ? "opening" : "closing";
      clip.inert = !open;

      const finish = (animateLines: boolean) => {
        stop();
        if (open) {
          if (animateLines && !preference.matches) {
            numberLines(body);
            details.dataset.answerLines = "";
          }
        } else {
          details.open = false;
          if (name) details.setAttribute("name", name);
          delete details.dataset.answerLines;
        }
        delete details.dataset.answerMotion;
        clip.inert = false;
        readingScroll?.afterOpen();
      };
      if (preference.matches || typeof clip.animate !== "function") { finish(false); return; }
      const duration = open ? 320 : 230;
      const frames = () => [{ height: from + "px" }, { height: (open ? body.offsetHeight : 0) + "px" }];
      expansion = clip.animate(frames(), { duration, easing: "cubic-bezier(.25,.65,.3,1)", fill: "both" });
      const current = expansion;
      expansion.onfinish = () => { if (expansion === current) finish(true); };
      if (!open) fade = body.animate([{ opacity }, { opacity: 0 }], { duration, fill: "both" });
      if (open && typeof ResizeObserver === "function") {
        // The admin history and form validation can change the content during expansion.
        resize = new ResizeObserver(() => {
          if (current === expansion) (current.effect as KeyframeEffect).setKeyframes(frames());
        });
        resize.observe(body);
      }
    }
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || !(event.target instanceof Element) ||
        event.target.closest("summary")?.parentElement !== details) return;
      event.preventDefault();
      move(!details.open || details.dataset.answerMotion === "closing");
    };
    const onFocus = (event: FocusEvent) => {
      if (details.dataset.answerMotion === "opening" && event.target instanceof Node && clip.contains(event.target)) {
        expansion?.finish();
      }
    };
    const onPreference = () => { if (preference.matches) expansion?.finish(); };
    closePanel.set(details, () => { if (details.open && details.dataset.answerMotion !== "closing") move(false); });
    details.addEventListener("click", onClick);
    details.addEventListener("focusin", onFocus);
    preference.addEventListener("change", onPreference);
    return () => {
      closePanel.delete(details);
      details.removeEventListener("click", onClick);
      details.removeEventListener("focusin", onFocus);
      preference.removeEventListener("change", onPreference);
      readingScroll?.cancel();
      stop();
    };
  }, [keepStartVisible, name]);

  const [summary, ...content] = Children.toArray(children);
  return <details {...props} ref={element} name={name}>
    {summary}
    <div className={`${styles.clip} ${clipClassName ?? ""}`} data-answer-clip="">
      <div className={`${styles.body} ${bodyClassName ?? ""}`} data-answer-body="">{prepareContent(content)}</div>
    </div>
  </details>;
}
