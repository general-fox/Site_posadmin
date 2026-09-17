"use client";

import { useSyncExternalStore } from "react";
import styles from "./back-to-top.module.css";

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function hasLeftPageTop() {
  return window.scrollY > Math.max(480, window.innerHeight * 0.9);
}

function returnToTop() {
  const heading =
    document.querySelector<HTMLElement>("main h1, h1") ??
    document.querySelector<HTMLElement>("main");

  // Move the keyboard reading position with the viewport, so hiding the
  // control at the top does not leave focus at the bottom of the document.
  if (heading) {
    if (!heading.hasAttribute("tabindex")) {
      heading.setAttribute("tabindex", "-1");
      heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), {
        once: true,
      });
    }
    heading.focus({ preventScroll: true });
  }

  if (window.location.hash) {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }

  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}

export function BackToTop() {
  const visible = useSyncExternalStore(subscribeToScroll, hasLeftPageTop, () => false);

  return (
    <button
      type="button"
      className={styles.button}
      data-visible={visible}
      aria-label="Вернуться в начало страницы"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={returnToTop}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 15V5M5.5 9.5 10 5l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={styles.label}>Наверх</span>
    </button>
  );
}
