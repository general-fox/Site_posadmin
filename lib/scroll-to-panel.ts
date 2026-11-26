// Keep the summary and roughly two lines of its answer together at the lower edge.
function readingNudge(details: HTMLDetailsElement, body: HTMLElement) {
  const summary = details.querySelector(":scope > summary");
  if (!summary || !details.open || !details.isConnected) return 0;
  const viewport = window.visualViewport;
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
  const header = document.querySelector(".site-header")?.getBoundingClientRect();
  const bar = details.closest("#pricing, #it-pricing")
    ? document.querySelector("[data-calculation-bar]")?.getBoundingClientRect() : null;
  const top = Math.max(viewportTop, header?.bottom ?? 0);
  const bottom = bar && bar.height > 0 && bar.bottom > viewportTop
    ? Math.min(viewportBottom, bar.top) : viewportBottom;
  const summaryTop = summary.getBoundingClientRect().top;
  if (summaryTop < top || summaryTop >= bottom) return 0;

  const firstLine = body.querySelector("[data-reveal-line-word], [data-answer-item], [data-answer-link]") ?? body;
  const lineHeight = parseFloat(getComputedStyle(firstLine).lineHeight) || 24;
  const readingEnd = Math.min(body.getBoundingClientRect().bottom, firstLine.getBoundingClientRect().top + 2 * lineHeight);
  const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
  return Math.max(0, Math.min(readingEnd + 12 - bottom, 96, summaryTop - top - 8, remaining));
}

/** Track intent from the activating click through expansion and any short scroll. */
export function prepareDisclosureScroll(details: HTMLDetailsElement, body: HTMLElement) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches || details.closest("dialog")) return;
  const controller = new AbortController();
  const options = { passive: true, signal: controller.signal };
  const origin = window.scrollY;
  let lastY = origin;
  let frame = 0;
  const cancel = () => {
    controller.abort();
    cancelAnimationFrame(frame);
  };
  for (const event of ["wheel", "touchstart", "pointerdown", "keydown", "focusin", "resize", "pagehide"]) {
    window.addEventListener(event, cancel, options);
  }
  // Also respect scrollbar drags, external anchor navigation and scroll anchoring.
  window.addEventListener("scroll", () => {
    if (Math.abs(window.scrollY - lastY) > 1) cancel();
  }, options);
  preference.addEventListener("change", cancel, options);

  function afterOpen() {
    if (controller.signal.aborted) return;
    const distance = readingNudge(details, body);
    if (distance < 2 || Math.abs(window.scrollY - origin) > 1) { cancel(); return; }
    const start = performance.now();
    const step = (now: number) => {
      if (controller.signal.aborted) return;
      if (Math.abs(window.scrollY - lastY) > 1) { cancel(); return; }
      const progress = Math.min(1, Math.max(0, (now - start) / 300));
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      lastY = origin + distance * eased;
      window.scrollTo({ top: lastY, behavior: "instant" });
      lastY = window.scrollY;
      if (progress < 1) frame = requestAnimationFrame(step);
      else cancel();
    };
    frame = requestAnimationFrame(step);
  }
  return { afterOpen, cancel };
}
