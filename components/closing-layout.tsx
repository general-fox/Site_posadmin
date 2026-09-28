"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { ContactsSection } from "./contacts-section";
import { SiteFooter } from "./site-footer";
import styles from "./closing-layout.module.css";

// Resolve anchors in normal document flow, independent of the two sticky
// underlays. Otherwise clicking a menu link while a panel is pinned undershoots.
function anchorTop(target: HTMLElement) {
  let top = target.getBoundingClientRect().top + window.scrollY;
  const closing = target.closest<HTMLElement>("[data-closing-underlay]");
  if (closing?.parentElement) {
    top -= closing.getBoundingClientRect().top - closing.parentElement.getBoundingClientRect().top;
  }
  const hero = target.closest<HTMLElement>("[data-hero-underlay]");
  if (hero?.parentElement && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const stage = hero.parentElement;
    const curtain = stage.querySelector<HTMLElement>("[data-hero-curtain]");
    // Include the reading hold after the curtain exits. Read the resolved
    // spacer height so responsive CSS and anchor navigation always agree.
    const travel = parseFloat(getComputedStyle(stage, "::after").height) || curtain?.offsetHeight || 0;
    top += travel - (hero.getBoundingClientRect().top - stage.getBoundingClientRect().top);
  }
  // Contacts have their own internal header clearance. Their dark surface must
  // meet the viewport edge, including on /about with its global scroll padding.
  if (target.id === "contact") return Math.max(0, top);
  return Math.max(0, top - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0)
    - (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0));
}

export function ClosingLayout({
  children,
  page = "home",
  ending,
}: {
  children: ReactNode;
  page?: "home" | "about" | "services" | "contacts" | "other";
  ending?: ReactNode;
}) {
  const underlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const underlay = underlayRef.current;
    if (!underlay) return;
    const measure = () => underlay.style.setProperty("--underlay-height", `${underlay.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(underlay);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const targetForHash = (hash: string) => {
      try { return hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; }
      catch { return null; }
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      const target = targetForHash(url.hash);
      if (url.hash && !target) return;
      if (!url.hash && url.pathname !== "/") return;
      event.preventDefault();
      if (url.href !== location.href) history.pushState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
      const destination = target?.querySelector<HTMLElement>("h1, h2, h3") ?? target;
      if (destination) {
        if (!destination.hasAttribute("tabindex")) {
          destination.setAttribute("tabindex", "-1");
          destination.addEventListener("blur", () => destination.removeAttribute("tabindex"), { once: true });
        }
        destination.focus({ preventScroll: true });
      }
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: target ? anchorTop(target) : 0, behavior: reduced ? "instant" : "smooth" });
    };
    const alignHash = () => {
      const target = targetForHash(location.hash);
      if (target) window.scrollTo({ top: anchorTop(target), behavior: "instant" });
    };
    let focusFrame = 0;
    const revealFocusedControl = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.closest("dialog") ||
        !target.matches("a[href], button, input, textarea, select, summary")) return;
      cancelAnimationFrame(focusFrame);
      // Run after native focus scrolling: it does not account for sticky panels.
      focusFrame = requestAnimationFrame(() => {
      if (document.activeElement !== target) return;
      const underlay = target.closest<HTMLElement>("[data-closing-underlay]");
      if (!underlay?.parentElement) {
        // The ending remains in ordinary flow; only the fixed header can cover
        // one of its controls after native keyboard focus scrolling.
        if (target.closest("[data-closing-ending]") && target.getBoundingClientRect().top < 80) {
          window.scrollTo({ top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 100), behavior: "instant" });
        }
        return;
      }
      const ending = underlay.nextElementSibling?.getBoundingClientRect();
      const bounds = target.getBoundingClientRect();
      const coveredByEnding = ending && ending.top < Math.min(window.innerHeight, bounds.bottom)
        && ending.bottom > Math.max(0, bounds.top);
      const hero = target.closest<HTMLElement>("[data-hero-underlay]");
      const curtain = hero?.parentElement?.querySelector<HTMLElement>("[data-hero-curtain]");
      const behindCurtain = curtain && curtain.getBoundingClientRect().bottom > Math.max(0, target.getBoundingClientRect().top);
      const outsideStickyView = hero && (bounds.top < 80 || bounds.bottom > window.innerHeight);
      // Native focus scrolling cannot see which sticky layer covers a control.
      // Reveal it in logical flow, including Shift+Tab back out of contacts.
      if (coveredByEnding || behindCurtain || outsideStickyView) {
        const logicalTop = anchorTop(target) - Math.min(180, window.innerHeight * .25);
        // A nested sticky sidebar may still be pinned after logical positioning.
        // Keep the ending below the viewport when revealing a covered control.
        const beforeEnding = coveredByEnding && ending
          ? window.scrollY + ending.top - window.innerHeight
          : Infinity;
        window.scrollTo({ top: Math.max(0, Math.min(logicalTop, beforeEnding)), behavior: "instant" });
      }
      });
    };
    const frame = requestAnimationFrame(alignHash);
    document.addEventListener("click", onClick, true);
    document.addEventListener("focusin", revealFocusedControl);
    window.addEventListener("hashchange", alignHash);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("focusin", revealFocusedControl);
      window.removeEventListener("hashchange", alignHash);
    };
  }, []);

  return <div className={styles.stack}>
    <div ref={underlayRef} className={`${styles.underlay} ${page === "home" ? styles.productUnderlay : ""}`} data-closing-underlay>{children}</div>
    <div className={`${styles.ending} ${page !== "home" ? styles.flushEnding : ""} ${page === "services" || page === "other" ? styles.footerEnding : ""}`} data-closing-ending data-header-surface="dark">
      {ending ?? <><ContactsSection flushTop /><SiteFooter /></>}
    </div>
  </div>;
}
