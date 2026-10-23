"use client";

import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { centerPanelInViewport } from "@/lib/scroll-to-panel";

/** Spread on a native details element. Initial open state and closing do not scroll. */
export function useDisclosureCentering() {
  const frame = useRef(0);
  const stopScrolling = useRef<(() => void) | null>(null);
  useEffect(() => () => {
    cancelAnimationFrame(frame.current);
    stopScrolling.current?.();
  }, []);

  const onClick = useCallback((event: MouseEvent<HTMLDetailsElement>) => {
    const details = event.currentTarget;
    const target = event.target;
    if (event.defaultPrevented || event.button !== 0 || !(target instanceof Element)) return;
    const summary = target.closest("summary");
    if (!summary || summary.parentElement !== details) return;
    cancelAnimationFrame(frame.current);
    stopScrolling.current?.();
    stopScrolling.current = null;
    if (details.open) return;
    // Let native disclosure, exclusive siblings and sticky-layer measurement
    // finish before calculating one final destination. Keyboard clicks work too.
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        if (details.open) {
          const panel = details.closest<HTMLElement>("[data-disclosure-panel]") ?? details;
          stopScrolling.current = centerPanelInViewport(panel);
        }
      });
    });
  }, []);

  return { onClick };
}
