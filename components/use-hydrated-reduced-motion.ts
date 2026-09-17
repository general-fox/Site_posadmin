"use client";

import { useSyncExternalStore } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeMotionPreference(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(motionQuery).matches;
}

// A stable server snapshot keeps hydration deterministic. The real preference
// is read immediately after hydration and also follows system setting changes.
export function useHydratedReducedMotion() {
  return useSyncExternalStore(
    subscribeMotionPreference,
    getMotionPreference,
    () => false,
  );
}
