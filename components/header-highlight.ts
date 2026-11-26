/** Position the desktop highlight independently of the links' text and hit areas. */
export function followHeaderLink(nav: HTMLElement, marker: HTMLElement) {
  const desktop = window.matchMedia("(min-width: 1024px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  let selected: HTMLElement | null = null;
  let left = 0;
  let width = 0;
  let motion: Animation | undefined;
  let interacted = false;

  function place(animate: boolean) {
    const target = nav.querySelector<HTMLElement>("[data-highlighted]");
    if (!desktop.matches || !target) {
      motion?.cancel();
      delete nav.dataset.movingHighlight;
      selected = null;
      return;
    }
    const navLeft = nav.getBoundingClientRect().left;
    const rect = target.getBoundingClientRect();
    const inset = 3;
    const nextLeft = rect.left - navLeft + inset;
    const nextWidth = rect.width - inset * 2;
    if (selected === target && left === nextLeft && width === nextWidth) return;

    // During rapid pointer travel, start at the currently painted location.
    const previous = selected && selected !== target && animate && interacted && !reduced.matches
      ? marker.getBoundingClientRect() : null;
    motion?.cancel();
    selected = target;
    left = nextLeft;
    width = nextWidth;
    const transform = `translateX(${left}px)`;
    marker.style.width = `${width}px`;
    marker.style.transform = transform;
    if (interacted) nav.dataset.movingHighlight = "";
    if (previous && typeof marker.animate === "function") {
      motion = marker.animate([
        { transform: `translateX(${previous.left - navLeft}px)`, width: `${previous.width}px` },
        { transform, width: `${width}px` },
      ], { duration: 215, easing: "cubic-bezier(.22,.7,.24,1)" });
    }
  }

  const remeasure = () => place(false);
  const observeSelection = new MutationObserver(() => place(true));
  observeSelection.observe(nav, { subtree: true, attributes: true, attributeFilter: ["data-highlighted"] });
  const observeSize = new ResizeObserver(remeasure);
  nav.querySelectorAll("a").forEach(link => observeSize.observe(link));
  for (const event of ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"]) {
    window.addEventListener(event, () => { interacted = true; }, { passive: true, once: true, signal: events.signal });
  }
  desktop.addEventListener("change", remeasure, { signal: events.signal });
  reduced.addEventListener("change", () => { motion?.cancel(); }, { signal: events.signal });
  remeasure();
  return () => {
    events.abort();
    motion?.cancel();
    observeSelection.disconnect();
    observeSize.disconnect();
    delete nav.dataset.movingHighlight;
  };
}
