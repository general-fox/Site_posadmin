"use client";

import { type ReactNode, useEffect } from "react";
import { ContactsSection } from "./contacts-section";
import { SiteFooter } from "./site-footer";
import styles from "./closing-layout.module.css";

function anchorTop(target: HTMLElement) {
  const top = target.getBoundingClientRect().top + window.scrollY;
  // Contacts use their own header clearance so their dark surface meets the viewport edge.
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
  page?: "home" | "services" | "contacts" | "other";
  ending?: ReactNode;
}) {
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
      const headingId = target?.dataset.anchorHeading;
      const heading = headingId ? document.getElementById(headingId) : null;
      const destination = heading ?? target?.querySelector<HTMLElement>("h1, h2, h3") ?? target;
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
      // Native focus scrolling may leave controls behind the fixed header.
      focusFrame = requestAnimationFrame(() => {
        if (document.activeElement !== target) return;
        const bounds = target.getBoundingClientRect();
        if (target.closest("[data-closing-underlay], [data-closing-ending]") && bounds.top < 80) {
          window.scrollTo({ top: Math.max(0, window.scrollY + bounds.top - 100), behavior: "instant" });
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
      <div className={`${styles.underlay} ${page === "home" ? styles.productUnderlay : ""}`} data-closing-underlay>{children}</div>
      <div className={`${styles.ending} ${page !== "home" ? styles.flushEnding : ""} ${page === "services" || page === "other" ? styles.footerEnding : ""}`} data-closing-ending data-header-surface="dark">
        {ending ?? <><ContactsSection flushTop /><SiteFooter /></>}
      </div>
    </div>;
}
