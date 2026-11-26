/** Gently finish a near-aligned card after native scrolling and its momentum stop. */
export function enableProductScrollSettling(stack: HTMLElement) {
  const anchors = Array.from(stack.querySelectorAll<HTMLElement>("[data-anchor-heading]"));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  const options = { passive: true, signal: events.signal };
  let timer = 0;
  let gestureStart: number | null = null;
  let lastY = window.scrollY;
  let direction = 0;
  let touching = false;
  let destination: number | null = null;

  function interrupt() {
    window.clearTimeout(timer);
    gestureStart = null;
    direction = 0;
    touching = false;
    if (destination !== null) {
      destination = null;
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
    }
  }

  function settle() {
    const start = gestureStart;
    gestureStart = null;
    if (start === null || !direction || touching || motion.matches || document.hidden) return;
    if (document.querySelector("dialog[open]") || (window.visualViewport && window.visualViewport.scale !== 1)) return;
    const firstCard = anchors[0]?.nextElementSibling;
    if (!firstCard || getComputedStyle(firstCard).position !== "sticky") return;

    // Tiny corrections should stay tiny. Never pull a reader back across a stop.
    const reach = Math.min(72, window.innerHeight * .08, Math.abs(window.scrollY - start));
    for (const anchor of anchors) {
      const gap = anchor.getBoundingClientRect().top - parseFloat(getComputedStyle(anchor).scrollMarginTop);
      if (gap * direction > 2 && Math.abs(gap) <= reach) {
        destination = window.scrollY + gap;
        window.scrollTo({ top: destination, behavior: "smooth" });
        break;
      }
    }
  }

  function schedule() {
    window.clearTimeout(timer);
    if (!touching && gestureStart !== null) timer = window.setTimeout(settle, 150);
  }

  function begin() {
    if (destination !== null) interrupt();
    if (motion.matches) return;
    // A passive wheel callback can already see the compositor's new scrollY.
    // Use the last delivered scroll event as the starting point of this gesture.
    if (gestureStart === null) gestureStart = lastY;
    schedule();
  }

  window.addEventListener("wheel", (event) => {
    if (event.ctrlKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) interrupt();
    else begin();
  }, options);
  window.addEventListener("touchstart", (event) => {
    interrupt();
    touching = event.touches.length === 1;
    if (touching) begin();
  }, options);
  window.addEventListener("touchend", (event) => {
    touching = event.touches.length > 0;
    schedule();
  }, options);
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    if (destination !== null && Math.abs(y - destination) <= 1) destination = null;
    if (gestureStart !== null && y !== lastY) {
      const step = Math.sign(y - lastY);
      if (direction && step !== direction) gestureStart = lastY;
      direction = step;
      schedule();
    }
    lastY = y;
  }, options);
  for (const event of ["touchcancel", "pointerdown", "keydown", "click", "focusin", "hashchange", "popstate", "pagehide", "resize"]) {
    window.addEventListener(event, interrupt, options);
  }
  motion.addEventListener("change", interrupt, options);
  return () => { events.abort(); interrupt(); };
}
