"use client";

import { AnimatePresence, motion, useIsPresent } from "framer-motion";
import { useLayoutEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useHydratedReducedMotion } from "./use-hydrated-reduced-motion";
import { UiIcon } from "./ui-icon";
import styles from "./dropdown.module.css";

export type DropdownOption = { value: string; label: string; description?: string; disabled?: boolean };

type ListProps = {
  id: string;
  label: string;
  anchor: RefObject<HTMLElement | null>;
  options: readonly DropdownOption[];
  active: number;
  selected?: string;
  onChoose: (index: number) => void;
};

function ListSurface({ id, label, anchor, options, active, selected, onChoose }: ListProps) {
  const surface = useRef<HTMLUListElement>(null);
  const present = useIsPresent();
  const reduced = useHydratedReducedMotion();
  const rowAnimations = useRef<Animation[]>([]);

  useLayoutEffect(() => {
    const field = anchor.current;
    const list = surface.current;
    if (!field || !list) return;
    const viewport = window.visualViewport;
    const panel = field.closest("form");
    const place = () => {
      const rect = field.getBoundingClientRect();
      const top = viewport?.offsetTop ?? 0;
      const bottom = top + (viewport?.height ?? window.innerHeight);
      const above = rect.top - top - 18;
      const below = bottom - rect.bottom - 18;
      const opensAbove = below < Math.min(260, list.scrollHeight) && above > below;
      list.dataset.side = opensAbove ? "above" : "below";
      list.style.left = rect.left + "px";
      list.style.top = (opensAbove ? rect.top - 6 : rect.bottom + 6) + "px";
      list.style.width = rect.width + "px";
      list.style.maxHeight = Math.max(0, Math.min(260, opensAbove ? above : below)) + "px";
      const panelRect = panel?.getBoundingClientRect();
      const center = (rect.top + rect.bottom) / 2;
      list.style.visibility = center > Math.max(top, panelRect?.top ?? top) &&
        center < Math.min(bottom, panelRect?.bottom ?? bottom) ? "visible" : "hidden";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(field);
    if (panel) observer.observe(panel);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    viewport?.addEventListener("resize", place);
    viewport?.addEventListener("scroll", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
      viewport?.removeEventListener("resize", place);
      viewport?.removeEventListener("scroll", place);
    };
  }, [anchor, options.length]);

  useLayoutEffect(() => {
    const list = surface.current;
    if (!list || reduced || !present || typeof list.animate !== "function") return;
    const animations = Array.from(list.children, (row, index) => row.animate([
      { opacity: 0, translate: "0 4px", filter: "blur(2px)" },
      { opacity: 1, translate: "0 0", filter: "blur(0px)" },
    ], { duration: 225, delay: 160 + Math.min(index, 6) * 28, easing: "ease-out", fill: "backwards" }));
    rowAnimations.current = animations;
    return () => animations.forEach(animation => animation.cancel());
  }, [present, reduced]);

  const lastActive = useRef(active);
  const lastOptions = useRef(options);
  useLayoutEffect(() => {
    const list = surface.current;
    if (!list || !present) return;
    if (active !== lastActive.current || options !== lastOptions.current) {
      // Typing or keyboard navigation takes priority over the decorative entrance.
      rowAnimations.current.forEach(animation => animation.cancel());
    }
    lastActive.current = active;
    lastOptions.current = options;
    const row = list.children[active] as HTMLElement | undefined;
    if (row && row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
    else if (row && row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
    }
  }, [active, options, present]);

  return <motion.ul ref={surface} id={id} role="listbox" aria-label={label} inert={!present} aria-hidden={!present || undefined}
    className={styles.popup}
    initial={reduced ? false : { "--list-covered": "100%" }}
    animate={{ "--list-covered": "0%" }}
    exit={{ "--list-covered": "100%" }}
    transition={{ duration: reduced ? 0 : present ? .16 : .14, ease: [.25, .65, .3, 1] }}
  >
    {options.map((option, index) => <li key={option.value} id={`${id}-${index}`} role="option"
      className={styles.option} aria-selected={selected === undefined ? active === index : option.value === selected}
      aria-disabled={option.disabled || undefined} data-active={active === index || undefined}
      onMouseDown={event => event.preventDefault()} onClick={() => { if (!option.disabled) onChoose(index); }}>
      <span>{option.label}</span>
      {option.description && <small>{option.description}</small>}
      {selected === option.value && <UiIcon name="check" size={16} />}
    </li>)}
  </motion.ul>;
}

export function DropdownList({ open, ...props }: ListProps & { open: boolean }) {
  const portal = props.anchor.current?.closest("dialog");
  return portal ? createPortal(<AnimatePresence>{open && <ListSurface {...props} />}</AnimatePresence>, portal) : null;
}
