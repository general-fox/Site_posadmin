/** A return entrance is only eligible after the entire surface has left the viewport. */
export function enableHomeScrollReplay(root: HTMLElement) {
  if (typeof IntersectionObserver !== "function" || typeof HTMLElement.prototype.animate !== "function") return;
  const excluded = "[data-page-hero], [data-preview-state], [data-scroll-replay='off'], dialog, [inert]";
  // Missing = never seen; null = currently visible; number = scroll position at exit.
  const lastExit = new WeakMap<HTMLElement, number | null>();
  const returning = new Set<HTMLElement>();
  const playing = new Map<HTMLElement, Animation>();
  const events = new AbortController();
  let lastY = window.scrollY;
  let direction = 0;

  function clearPreview(node: HTMLElement) {
    returning.delete(node);
    delete node.dataset.replayPending;
  }

  function cancelActive() {
    returning.forEach(clearPreview);
    for (const animation of playing.values()) animation.cancel();
    playing.clear();
  }

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (y === lastY) return;
    direction = Math.sign(y - lastY);
    lastY = y;
    if (direction < 0 && (playing.size || returning.size)) cancelActive();
  }, { passive: true, signal: events.signal });

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const node = entry.target as HTMLElement;
      const exitY = lastExit.get(node);
      if (!entry.isIntersecting) {
        if (exitY === null) lastExit.set(node, window.scrollY);
        clearPreview(node);
        continue;
      }
      const eligible = direction > 0 && !document.hidden && !node.closest(excluded) &&
        (!node.hasAttribute("data-reveal-target") || node.dataset.revealState === "settled") &&
        !(node.contains(document.activeElement) && document.activeElement?.matches(":focus-visible"));
      if (exitY !== null) {
        if (exitY !== undefined && window.scrollY !== exitY && eligible) {
          // Stage opacity at the viewport edge so the visible card never flashes back to dim.
          returning.add(node);
          node.dataset.replayPending = "";
        }
        lastExit.set(node, null);
      }
      if (!returning.has(node)) continue;
      if (!eligible) { clearPreview(node); continue; }
      if (entry.intersectionRect.height + 1 < Math.min(64, entry.boundingClientRect.height * 0.32)) continue;
      clearPreview(node);

      const animation = node.animate([
        { opacity: 0.24, scale: "0.95", translate: "0 12px" },
        { opacity: 1, scale: "1", translate: "0 0" },
      ], { id: "scroll-replay", duration: 560, easing: "cubic-bezier(.26,.48,.32,1)" });
      playing.set(node, animation);
      animation.onfinish = () => playing.delete(node);
    }
  }, { threshold: [0, 0.04, 0.08, 0.16, 0.24, 0.32] });

  // First entrances have already registered their surfaces in child layout effects.
  root.querySelectorAll<HTMLElement>("[data-reveal-target], [data-scroll-replay-item]").forEach((node) => {
    if (!node.closest(excluded)) observer.observe(node);
  });
  const reset = () => { direction = 0; lastY = window.scrollY; cancelActive(); };
  window.addEventListener("resize", reset, { signal: events.signal });
  document.addEventListener("visibilitychange", reset, { signal: events.signal });
  const finishInteraction = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    returning.forEach((node) => { if (node.contains(target) || node.closest(excluded)) clearPreview(node); });
    for (const [node, animation] of playing) {
      if (node.contains(target) || node.closest(excluded)) { animation.cancel(); playing.delete(node); }
    }
  };
  root.addEventListener("pointerdown", finishInteraction, { signal: events.signal });
  root.addEventListener("focusin", finishInteraction, { signal: events.signal });
  return () => { events.abort(); observer.disconnect(); cancelActive(); };
}
