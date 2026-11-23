"use client";

import styles from "./section-atmosphere.module.css";

const EDGE_PATHS = [
  "M-64 -16 L48 96 Q68 116 96 116 H460",
  "M-64 -56 L60 68 Q80 88 108 88 H460",
  "M-64 -116 L92 40 Q112 60 140 60 H460",
] as const;

export function SectionAtmosphere({ side = "left" }: { side?: "left" | "right" }) {
  return (
    <div className={`${styles.atmosphere} ${side === "right" ? styles.right : ""}`} aria-hidden="true">
      <svg className={styles.circuit} viewBox="0 0 460 132" fill="none" focusable="false">
        {EDGE_PATHS.map((path) => (
          <path key={path} d={path} stroke="var(--accent-border)" strokeWidth="0.75" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}
