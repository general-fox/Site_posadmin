"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type RefObject } from "react";
import { DropdownList, type DropdownOption } from "./dropdown-list";
import { UiIcon } from "./ui-icon";
import styles from "./dropdown.module.css";

type SelectProps = {
  id: string; label: string; name: string; value: string; options: readonly DropdownOption[];
  className: string; describedBy?: string; disabled?: boolean; required?: boolean;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  onChange: (value: string) => void;
  onFocus?: () => void;
};
const subscribe = () => () => {};

/** The native control handles form submission and validation; its visible counterpart
 * keeps DOM focus while the active list option is announced and changed. */
export function AnimatedSelect({ id, label, name, value, options, className, describedBy, disabled,
  required, triggerRef, onChange, onFocus }: SelectProps) {
  const localRef = useRef<HTMLButtonElement>(null);
  const trigger = triggerRef ?? localRef;
  const enhanced = useSyncExternalStore(subscribe, () => true, () => false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [invalid, setInvalid] = useState(false);
  const search = useRef({ text: "", time: 0 });
  const listId = useId();
  const current = options.findIndex(option => option.value === value);
  const first = options.findIndex(option => !option.disabled);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const node = event.target;
      if (node instanceof Node && !trigger.current?.contains(node) && !document.getElementById(listId)?.contains(node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside, true);
    return () => document.removeEventListener("pointerdown", outside, true);
  }, [open, listId, trigger]);

  const show = () => {
    setActive(current >= 0 && !options[current].disabled ? current : first);
    search.current = { text: "", time: 0 };
    setOpen(true);
  };
  const choose = (index: number) => {
    if (!options[index] || options[index].disabled) return;
    onChange(options[index].value);
    setInvalid(false);
    setOpen(false);
  };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.nativeEvent.isComposing || event.ctrlKey || event.metaKey) return;
    const key = event.key;
    if (key === "Escape" && open) {
      event.preventDefault(); event.stopPropagation(); setOpen(false);
    } else if (key === "Tab" && open) {
      choose(active);
    } else if (key === " " || key === "Enter") {
      event.preventDefault();
      if (open) choose(active); else show();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) {
      event.preventDefault();
      if (!open) show();
      const start = open ? active : current;
      const next = key === "Home" ? first : key === "End" ? options.findLastIndex(option => !option.disabled)
        : key === "ArrowDown" ? options.findIndex((option, i) => i > start && !option.disabled)
        : options.findLastIndex((option, i) => i < start && !option.disabled);
      if (next !== -1) setActive(next);
    } else if (key.length === 1 && !event.altKey) {
      event.preventDefault();
      const now = performance.now();
      const char = key.toLocaleLowerCase("ru");
      const text = now - search.current.time > 700 ? char : search.current.text + char;
      search.current = { text, time: now };
      const prefix = [...text].every(letter => letter === char) ? char : text;
      const start = prefix.length === 1 ? (open ? active : current) + 1 : 0;
      for (let offset = 0; offset < options.length; offset++) {
        const index = (start + offset) % options.length;
        if (!options[index].disabled && options[index].label.toLocaleLowerCase("ru").startsWith(prefix)) {
          if (open) setActive(index); else choose(index);
          break;
        }
      }
    }
  };
  return <>
    <select id={enhanced ? undefined : id} className={`${className} ${styles.native}`} hidden={enhanced}
      name={name} disabled={disabled} required={required} value={value} aria-describedby={describedBy}
      onChange={event => onChange(event.currentTarget.value)} onFocus={enhanced ? undefined : onFocus}
      onInvalid={event => {
        if (enhanced) { event.preventDefault(); setInvalid(true); trigger.current?.focus(); show(); }
      }}>
      {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
    {enhanced && <>
      <button ref={trigger} id={id} type="button" role="combobox" className={`${className} ${styles.trigger}`}
        data-button-reveal="off" aria-expanded={open} aria-haspopup="listbox"
        aria-controls={open ? listId : undefined} aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-describedby={describedBy} aria-invalid={invalid || undefined} aria-required={required}
        disabled={disabled} onFocus={onFocus} onBlur={() => setOpen(false)} onKeyDown={keyDown}
        onClick={event => {
          event.currentTarget.focus({ preventScroll: true });
          if (open) setOpen(false); else show();
        }}>
        <span>{options[current]?.label}</span><UiIcon name="chevron-down" size={16} />
      </button>
      <DropdownList anchor={trigger} id={listId} label={label} open={open && !disabled}
        options={options} active={active} selected={value} onChoose={choose} />
    </>}
  </>;
}
