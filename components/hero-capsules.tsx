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
}: {
  reduced: boolean | null;
  width: number;
  height: number;
}) {
  const parallaxEntry = useParallaxEntry();
  const stageW = Math.max(280, width || BASE_W);
  const stageH = Math.max(120, height || BASE_H);
  const sx = stageW / BASE_W;
  const sy = stageH / BASE_H;

  const tags = useMemo(
    () =>
      TAGS.map((t) => ({
        ...t,
        dx: Math.round(t.dx * sx),
        dy: Math.round(t.dy * sy),
      })),
    [sx, sy],
  );

  return (
    <div className="hero-capsules pointer-events-none absolute inset-0 overflow-visible">
      {tags.map((tag) => (
        <motion.span
          key={`${tag.label}-${parallaxEntry}`}
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
                  delay:
                    parallaxEntry > 0
                      ? tag.delay * 0.25
                      : 1.7 + tag.delay * 1.4,
                }
          }
        >
          {tag.label}
        </motion.span>
      ))}
    </div>
  );
}
