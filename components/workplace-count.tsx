"use client";

import { useEffect, useState } from "react";
import { MAX_ONLINE_WORKPLACES, MIN_ONLINE_WORKPLACES } from "@/lib/workplace-count";
import { UiIcon } from "./ui-icon";
import styles from "./support-pricing.module.css";

type WorkplaceCountProps = {
  id: string;
  name?: string;
  value: number;
  label?: string;
  description: string;
  min?: number;
  max?: number;
  limitNote?: string;
  className?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  revealItem?: boolean;
};

export function WorkplaceCount({
  id, name, value, label, description, min = MIN_ONLINE_WORKPLACES, max = MAX_ONLINE_WORKPLACES,
  limitNote, className = `${styles.countRow} ${styles.workplaceRow}`, onChange, disabled = false, revealItem = false,
}: WorkplaceCountProps) {
  const [draft, setDraft] = useState(String(value));
  const [limitNotice, setLimitNotice] = useState(0);
  const descriptionId = `${id}-description`;
  const limitId = `${id}-limit`;
  const atLimit = value === max;
  const limitVisible = Boolean(limitNote) && atLimit && limitNotice > 0;
  const incrementLabel = label ? `Увеличить: ${label}` : "Увеличить количество рабочих мест";
  const limitLabel = label ? `Показать подсказку о лимите: ${label}` : "Показать подсказку о лимите рабочих мест";

  useEffect(() => {
    if (!limitVisible) return;
    const timer = window.setTimeout(() => setLimitNotice(0), 5000);
    return () => window.clearTimeout(timer);
  }, [limitNotice, limitVisible]);

  function showLimit() {
    setLimitNotice((previous) => previous + 1);
  }

  function updateCount(next: number) {
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  return <div
    className={`${styles.countField} ${className}`}
    data-reveal-item={revealItem ? "" : undefined}
    data-limit-visible={limitVisible || undefined}
    onKeyDown={(event) => { if (event.key === "Escape" && limitVisible) setLimitNotice(0); }}
  >
    <div>
      <label htmlFor={id}>{label ?? "Количество рабочих мест"}</label>
      <p id={descriptionId}>{description}</p>
    </div>
    <div className={styles.stepper}>
      <button type="button" aria-label={label ? `Уменьшить: ${label}` : "Уменьшить количество рабочих мест"} disabled={disabled || value === min} onClick={() => updateCount(value - 1)}><UiIcon name="minus" /></button>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={1}
        value={draft}
        disabled={disabled}
        aria-describedby={limitVisible ? `${descriptionId} ${limitId}` : descriptionId}
        onChange={(event) => {
          const raw = event.target.value;
          const next = Number(raw);
          if (next >= max) {
            updateCount(max);
            if (limitNote) showLimit();
            return;
          }
          setDraft(raw);
          if (raw && Number.isInteger(next) && next >= min && next !== value) onChange(next);
        }}
        onBlur={() => {
          const parsed = Number(draft);
          const next = draft && Number.isFinite(parsed)
            ? Math.min(max, Math.max(min, Math.floor(parsed)))
            : value;
          updateCount(next);
        }}
        onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
      />
      <button
        type="button"
        aria-label={atLimit && limitNote ? limitLabel : incrementLabel}
        aria-describedby={limitVisible ? limitId : undefined}
        disabled={disabled || (atLimit && !limitNote)}
        onClick={() => {
          const next = Math.min(max, value + 1);
          updateCount(next);
          if (next === max && limitNote) showLimit();
        }}
      ><UiIcon name="plus" /></button>
    </div>
    {limitNote && <p id={limitId} className={styles.countLimit} role="status">{limitVisible ? limitNote : null}</p>}
  </div>;
}
