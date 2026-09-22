"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ONSITE_SUPPORT_LOCATIONS, type OnsiteSupportLocation } from "@/lib/onsite-support";
import styles from "./city-select.module.css";

const LOCATIONS = [...ONSITE_SUPPORT_LOCATIONS, { id: "other", name: "Другой город" }] as const;

type CitySelectProps = {
  id: string;
  descriptionId: string;
  value: OnsiteSupportLocation | "";
  disabled: boolean;
  onChange: (value: OnsiteSupportLocation) => void;
};

export function CitySelect({ id, descriptionId, value, disabled, onChange }: CitySelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [placement, setPlacement] = useState({ above: false, height: 304 });
  const selectedIndex = LOCATIONS.findIndex((item) => item.id === value);
  const expanded = open && !disabled;
  const listId = `${id}-list`;

  const showOptions = (index = Math.max(0, selectedIndex)) => {
    const bounds = rootRef.current?.getBoundingClientRect();
    if (bounds) {
      const below = window.innerHeight - bounds.bottom;
      const above = bounds.top;
      const openAbove = below < 280 && above > below;
      setPlacement({ above: openAbove, height: Math.min(304, Math.max(144, (openAbove ? above : below) - 16)) });
    }
    searchRef.current = { text: "", time: 0 };
    setActiveIndex(index);
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(LOCATIONS[index].id);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!expanded) return;
    const dismissOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const dismissOnResize = () => setOpen(false);
    document.addEventListener("pointerdown", dismissOutside);
    window.addEventListener("resize", dismissOnResize);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      window.removeEventListener("resize", dismissOnResize);
    };
  }, [expanded]);

  useEffect(() => {
    const list = listRef.current;
    const option = list?.children[activeIndex] as HTMLElement | undefined;
    if (!expanded || !list || !option) return;
    if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
    }
  }, [activeIndex, expanded]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Tab") { setOpen(false); return; }
    if (event.key === "Escape") {
      if (expanded) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (expanded) choose(activeIndex);
      else showOptions();
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const index = event.key === "Home" ? 0 : event.key === "End" ? LOCATIONS.length - 1
        : expanded ? Math.min(LOCATIONS.length - 1, Math.max(0, activeIndex + (event.key === "ArrowDown" ? 1 : -1)))
        : selectedIndex >= 0 ? selectedIndex : event.key === "ArrowUp" ? LOCATIONS.length - 1 : 0;
      if (expanded) setActiveIndex(index);
      else showOptions(index);
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const previous = now - searchRef.current.time < 700 ? searchRef.current.text : "";
      const query = (previous + event.key).toLocaleLowerCase("ru");
      const repeatedCharacter = [...query].every((character) => character === query[0]);
      const prefix = repeatedCharacter ? query[0] : query;
      const start = repeatedCharacter ? (expanded ? activeIndex : selectedIndex) + 1 : 0;
      const index = Array.from({ length: LOCATIONS.length }, (_, offset) => (start + offset) % LOCATIONS.length)
        .find((candidate) => LOCATIONS[candidate].name.toLocaleLowerCase("ru").startsWith(prefix)) ?? -1;
      if (!expanded) showOptions(index >= 0 ? index : Math.max(0, selectedIndex));
      else if (index >= 0) setActiveIndex(index);
      searchRef.current = { text: query, time: now };
    }
  };

  return <div className={styles.root} ref={rootRef} data-open={expanded} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button
      id={id}
      ref={triggerRef}
      type="button"
      role="combobox"
      className={styles.trigger}
      data-placeholder={!value}
      disabled={disabled}
      aria-label="Город или регион заведения"
      aria-describedby={descriptionId}
      aria-expanded={expanded}
      aria-haspopup="listbox"
      aria-controls={expanded ? listId : undefined}
      aria-activedescendant={expanded ? `${id}-option-${LOCATIONS[activeIndex].id}` : undefined}
      onClick={() => expanded ? setOpen(false) : showOptions()}
      onKeyDown={handleKeyDown}
    >
      <span>{selectedIndex >= 0 ? LOCATIONS[selectedIndex].name : "Выберите город"}</span>
      <svg className={styles.chevron} viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
    {expanded && <ul id={listId} ref={listRef} className={styles.options} role="listbox" aria-label="Города и регионы" data-above={placement.above} style={{ maxHeight: placement.height }}>
      {LOCATIONS.map((item, index) => <li
        key={item.id}
        id={`${id}-option-${item.id}`}
        role="option"
        aria-selected={value === item.id}
        data-active={activeIndex === index}
        data-other={item.id === "other"}
        onPointerMove={(event) => { if (event.pointerType === "mouse") setActiveIndex(index); }}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => choose(index)}
      >
        <span>{item.name}</span>
        {value === item.id && <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </li>)}
    </ul>}
  </div>;
}
