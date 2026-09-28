"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useParallaxEntry } from "@/components/full-page-parallax";

/** Offsets from title center; designed for ~460×148 title box. */
const BASE_W = 460;
const BASE_H = 148;

/** Loose arc above the title — wider at the edges, deliberately uneven. */
const TAGS = [
  { label: "егаис", dx: -352, dy: -38, rot: 9, delay: 0.28 },
  { label: "бронирование", dx: -288, dy: -132, rot: -12, delay: 0.06 },
  { label: "1С", dx: -172, dy: -190, rot: 6, delay: 0.22 },
  { label: "техподдержка", dx: -58, dy: -152, rot: -4, delay: 0.08 },
  { label: "r_keeper", dx: 62, dy: -198, rot: 7, delay: 0.18 },
  { label: "чз", dx: 178, dy: -140, rot: -9, delay: 0.14 },
  { label: "лояльность", dx: 268, dy: -188, rot: 4, delay: 0.1 },
  { label: "меркурий", dx: 322, dy: -74, rot: -13, delay: 0.34 },
  { label: "ккт", dx: 358, dy: -26, rot: 11, delay: 0.02 },
] as const;

// Tablets keep a separate band above the heading.
const COMPACT_ARC: Record<typeof TAGS[number]["label"], { dx: number; dy: number; rot: number }> = {
  "егаис": { dx: -97, dy: -2, rot: 9 },
  "бронирование": { dx: -21, dy: -46, rot: -6 },
  "1С": { dx: -109, dy: -48, rot: -14 },
  "техподдержка": { dx: 17, dy: 52, rot: 7 },
  "r_keeper": { dx: -19, dy: -1, rot: -8 },
  "чз": { dx: 94, dy: -39, rot: 12 },
  "лояльность": { dx: 83, dy: 5, rot: 10 },
  "меркурий": { dx: -87, dy: 44, rot: -11 },
  "ккт": { dx: 108, dy: 45, rot: -13 },
};

const LANDSCAPE_ARC: typeof COMPACT_ARC = {
  "егаис": { dx: -169, dy: 24, rot: 10 },
  "бронирование": { dx: -123, dy: -24, rot: 5 },
  "1С": { dx: -206, dy: -24, rot: -12 },
  "техподдержка": { dx: -64, dy: 26, rot: -5 },
  "r_keeper": { dx: -11, dy: -27, rot: -7 },
  "чз": { dx: 199, dy: -27, rot: -11 },
  "лояльность": { dx: 101, dy: -22, rot: 8 },
  "меркурий": { dx: 68, dy: 23, rot: 9 },
  "ккт": { dx: 169, dy: 25, rot: -13 },
};

// Mobile offsets frame the heading and buttons. Negative gaps start at the
// heading's top; positive gaps start below the measured action group.
const MOBILE_ARC: Record<typeof TAGS[number]["label"], { dx: number; gap: number; rot: number }> = {
  "1С": { dx: -108, gap: -76, rot: -10 },
  "бронирование": { dx: -8, gap: -76, rot: -6 },
  "чз": { dx: 107, gap: -76, rot: 8 },
  "r_keeper": { dx: -60, gap: -32, rot: -6 },
  "лояльность": { dx: 65, gap: -32, rot: 6 },
  "егаис": { dx: -91, gap: 32, rot: -8 },
  "техподдержка": { dx: 26, gap: 32, rot: 5 },
  "меркурий": { dx: -48, gap: 76, rot: -6 },
  "ккт": { dx: 80, gap: 76, rot: 9 },
};

const burstSpring = {
  type: "spring" as const,
  stiffness: 120,
  damping: 20,
  mass: 1.1,
};

export function HeroCapsules({
  reduced,
  width,
  height,
  actionsHeight,
  containerWidth,
  compact,
  short,
  mobile,
}: {
  reduced: boolean | null;
  width: number;
  height: number;
  actionsHeight: number;
  containerWidth: number;
  compact: boolean;
  short: boolean;
  mobile: boolean;
}) {
  const parallaxEntry = useParallaxEntry();
  const stageW = Math.max(280, width || BASE_W);
  const stageH = Math.max(120, height || BASE_H);
  const sx = Math.min(stageW / BASE_W, Math.max(0, containerWidth / 2 - 76) / 358);
  const sy = stageH / BASE_H;
  const compactScale = Math.min(480, Math.max(0, containerWidth - 40)) / (short ? 480 : 280);
  const mobileScale = Math.min(1.25, Math.max(0, containerWidth - 40) / 280);

  const tags = useMemo(
    () =>
      TAGS.map((t) => {
        if (mobile) {
          const position = MOBILE_ARC[t.label];
          return {
            ...t,
            dx: Math.round(position.dx * mobileScale),
            dy: Math.round(Math.sign(position.gap) * height / 2 + position.gap + (position.gap > 0 ? actionsHeight + 24 : 0)),
            rot: position.rot,
          };
        }
        const position = compact ? (short ? LANDSCAPE_ARC : COMPACT_ARC)[t.label] : undefined;
        return {
          ...t,
          dx: Math.round(position ? position.dx * compactScale : t.dx * sx),
          dy: Math.round(position ? position.dy : t.dy * sy),
          rot: position ? position.rot : t.rot,
        };
      }),
    [sx, sy, compact, compactScale, short, mobile, mobileScale, height, actionsHeight],
  );

  return (
    <div className="hero-capsules pointer-events-none absolute inset-0 overflow-visible" data-compact={compact}>
      {tags.map((tag) => (
        <motion.span
          key={`${tag.label}-${compact}-${short}-${mobile}-${parallaxEntry}`}
          className="hero-fall-tag absolute top-1/2 left-1/2 z-[5] select-none"
          transformTemplate={({ x, y, scale, rotate }) =>
            `translateX(-50%) translateY(-50%) translateX(${x}) translateY(${y}) scale(${scale}) rotate(${rotate})`
          }
          initial={
            reduced
              ? { x: tag.dx, y: tag.dy, rotate: tag.rot, scale: 1, opacity: 1 }
              : { x: 0, y: 0, rotate: 0, scale: 0.32, opacity: 0 }
          }
          animate={{
            x: tag.dx,
            y: tag.dy,
            rotate: tag.rot,
            scale: 1,
            opacity: 1,
          }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  ...burstSpring,
                  delay: parallaxEntry > 0 ? tag.delay * 0.25 : 1.7 + tag.delay * 1.4,
                }
          }
        >
          {tag.label}
        </motion.span>
      ))}
    </div>
  );
}
