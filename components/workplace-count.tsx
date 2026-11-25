"use client";

import { useEffect, useState } from "react";
import { isOnlineWorkplaceCount, MAX_ONLINE_WORKPLACES, MIN_ONLINE_WORKPLACES } from "@/lib/workplace-count";
import { UiIcon } from "./ui-icon";
import styles from "./support-pricing.module.css";

type WorkplaceCountProps = {
  id: string;
  value: number;
  description: string;
  limitNote: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  revealItem?: boolean;
};

export function WorkplaceCount({ id, value, description, limitNote, onChange, disabled = false, revealItem = false }: WorkplaceCountProps) {
  const [draft, setDraft] = useState(String(value));
  const [limitNotice, setLimitNotice] = useState(0);
  const descriptionId = `${id}-description`;
  const limitId = `${id}-limit`;
  const atLimit = value === MAX_ONLINE_WORKPLACES;
  const limitVisible = atLimit && limitNotice > 0;

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
    className={`${styles.countRow} ${styles.workplaceRow}`}
    data-reveal-item={revealItem ? "" : undefined}
    data-limit-visible={limitVisible || undefined}
    onKeyDown={(event) => { if (event.key === "Escape" && limitVisible) setLimitNotice(0); }}
  >
    <div>
      <label htmlFor={id}>Количество рабочих мест</label>
      <p id={descriptionId}>{description}</p>
    </div>
    <div className={styles.stepper}>
      <button type="button" aria-label="Уменьшить количество рабочих мест" disabled={disabled || value === MIN_ONLINE_WORKPLACES} onClick={() => updateCount(value - 1)}><UiIcon name="minus" /></button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={MIN_ONLINE_WORKPLACES}
        max={MAX_ONLINE_WORKPLACES}
        step={1}
        value={draft}
        disabled={disabled}
        aria-describedby={limitVisible ? `${descriptionId} ${limitId}` : descriptionId}
        onChange={(event) => {
          const raw = event.target.value;
          const next = Number(raw);
          if (next >= MAX_ONLINE_WORKPLACES) {
            updateCount(MAX_ONLINE_WORKPLACES);
            showLimit();
            return;
          }
          setDraft(raw);
          if (isOnlineWorkplaceCount(next) && next !== value) onChange(next);
        }}
        onBlur={() => {
          const parsed = Number(draft);
          const next = draft && Number.isFinite(parsed)
            ? Math.min(MAX_ONLINE_WORKPLACES, Math.max(MIN_ONLINE_WORKPLACES, Math.floor(parsed)))
            : value;
          updateCount(next);
        }}
        onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
      />
      <button
        type="button"
        aria-label={atLimit ? "Показать подсказку о лимите рабочих мест" : "Увеличить количество рабочих мест"}
        aria-describedby={limitVisible ? limitId : undefined}
        disabled={disabled}
        onClick={() => {
          const next = Math.min(MAX_ONLINE_WORKPLACES, value + 1);
          updateCount(next);
          if (next === MAX_ONLINE_WORKPLACES) showLimit();
        }}
      ><UiIcon name="plus" /></button>
    </div>
    <p id={limitId} className={styles.countLimit} role="status">{limitVisible ? limitNote : null}</p>
  </div>;
}
