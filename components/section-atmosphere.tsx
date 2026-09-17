"use client";

import { useId } from "react";
import styles from "./section-atmosphere.module.css";

const EDGE_PATHS = [
  "M-64 -16 L48 96 Q68 116 96 116 H460",
  "M-64 -56 L60 68 Q80 88 108 88 H460",
  "M-64 -116 L92 40 Q112 60 140 60 H460",
] as const;

export function SectionAtmosphere({ side = "left" }: { side?: "left" | "right" }) {
  const fadeId = `section-atmosphere-${useId().replace(/:/g, "")}`;

  return (
    <div className={`${styles.atmosphere} ${side === "right" ? styles.right : ""}`} aria-hidden="true">
      <svg className={styles.circuit} viewBox="0 0 460 132" fill="none" focusable="false">
        <defs>
          <linearGradient id={fadeId} x1="0" y1="0" x2="460" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--ink)" stopOpacity="0" />
            <stop offset=".16" stopColor="var(--ink)" stopOpacity=".1" />
            <stop offset=".3" stopColor="var(--ink)" stopOpacity=".08" />
            <stop offset=".7" stopColor="var(--ink)" stopOpacity=".025" />
            <stop offset="1" stopColor="var(--ink)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {EDGE_PATHS.map((path) => (
          <path key={path} d={path} stroke={`url(#${fadeId})`} strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
    </div>
  );
}
