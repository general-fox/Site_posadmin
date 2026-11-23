"use client";

import { ONSITE_SUPPORT_LOCATIONS, type OnsiteSupportLocation } from "@/lib/onsite-support";
import styles from "./city-select.module.css";

const LOCATIONS = [...ONSITE_SUPPORT_LOCATIONS, { id: "other", name: "Другой город" }] as const;

type CitySelectProps = {
  id: string;
  label: string;
  descriptionId: string;
  value: OnsiteSupportLocation | "";
  disabled: boolean;
  onChange: (value: OnsiteSupportLocation) => void;
};

export function CitySelect({ id, label, descriptionId, value, disabled, onChange }: CitySelectProps) {
  return (
    <fieldset id={id} className={styles.group} disabled={disabled} aria-describedby={descriptionId}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.options}>
        {LOCATIONS.map((location) => (
          <label key={location.id} className={styles.option}>
            <input
              className={styles.input}
              type="radio"
              name={id}
              value={location.id}
              checked={value === location.id}
              onChange={() => onChange(location.id)}
            />
            <span className={styles.chip}>{location.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
