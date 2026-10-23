type PanelPosition = {
  panelTop: number;
  panelHeight: number;
  viewportTop?: number;
  viewportHeight: number;
  headerBottom: number;
  bottomInset?: number;
  maxScroll: number;
};

/** Center short content below the menu; keep the beginning of long content visible. */
export function centeredPanelScrollTop({
  panelTop, panelHeight, viewportTop = 0, viewportHeight, headerBottom, bottomInset = 16, maxScroll,
}: PanelPosition) {
  const topInset = Math.max(viewportTop + 16, headerBottom + 16);
  const availableHeight = Math.max(0, viewportTop + viewportHeight - bottomInset - topInset);
  const targetTop = topInset + Math.max(0, (availableHeight - panelHeight) / 2);
  return Math.max(0, Math.min(maxScroll, panelTop - targetTop));
}

// These two layers can remain pinned while the document keeps scrolling.
// Use their normal-flow positions, not their currently painted positions.
function panelDocumentTop(panel: HTMLElement) {
  let top = panel.getBoundingClientRect().top + window.scrollY;
  const closing = panel.closest<HTMLElement>("[data-closing-underlay]");
  if (closing?.parentElement && getComputedStyle(closing).position === "sticky") {
    top -= closing.getBoundingClientRect().top - closing.parentElement.getBoundingClientRect().top;
  }
  const hero = panel.closest<HTMLElement>("[data-hero-underlay]");
  if (hero?.parentElement && getComputedStyle(hero).position === "sticky") {
    const stage = hero.parentElement;
    const travel = Number.parseFloat(getComputedStyle(stage, "::after").height) || 0;
    top += travel - (hero.getBoundingClientRect().top - stage.getBoundingClientRect().top);
  }
  return top;
}

/** One native, interruptible scroll. Never locks the page or moves keyboard focus. */
export function centerPanelInViewport(panel: HTMLElement) {
  if (!panel.isConnected || panel.closest("dialog")) return () => {};
  const viewport = window.visualViewport;
  const header = document.querySelector<HTMLElement>(".site-header");
  const viewportTop = viewport?.offsetTop ?? 0;
  const viewportHeight = viewport?.height ?? window.innerHeight;
  const calculationBar = panel.closest("#pricing, #it-pricing")
    ? document.querySelector<HTMLElement>("[data-calculation-bar]")?.getBoundingClientRect()
    : null;
  const bottomInset = calculationBar && calculationBar.height > 0 && calculationBar.bottom > viewportTop
    ? Math.max(16, viewportTop + viewportHeight - calculationBar.top + 16)
    : 16;
  const top = centeredPanelScrollTop({
    panelTop: panelDocumentTop(panel),
    panelHeight: panel.getBoundingClientRect().height,
    viewportTop,
    viewportHeight,
    headerBottom: header?.getBoundingClientRect().bottom ?? 0,
    bottomInset,
    maxScroll: document.documentElement.scrollHeight - window.innerHeight,
  });
  if (Math.abs(window.scrollY - top) < 2) return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: reduced ? "instant" : "smooth" });
  if (reduced) return () => {};

  const controller = new AbortController();
  let timeout = 0;
  const cleanUp = () => { controller.abort(); window.clearTimeout(timeout); };
  const interrupt = () => {
    if (controller.signal.aborted) return;
    cleanUp();
    window.scrollTo({ top: window.scrollY, behavior: "instant" });
  };
  const options = { passive: true, signal: controller.signal };
  window.addEventListener("wheel", interrupt, options);
  window.addEventListener("touchstart", interrupt, options);
  window.addEventListener("pointerdown", interrupt, options);
  window.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " ", "Tab", "Escape"].includes(event.key)) interrupt();
  }, options);
  window.addEventListener("scrollend", cleanUp, { ...options, once: true });
  timeout = window.setTimeout(cleanUp, 1_500);
  return interrupt;
}
