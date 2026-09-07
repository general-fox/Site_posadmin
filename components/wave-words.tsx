"use client";

import { motion } from "framer-motion";

const waveEase = [0.33, 1, 0.68, 1] as const;

export function WaveWords({
  text,
  base,
  stagger = 0.08,
  duration = 1,
  reduced,
  align = "center",
  onComplete,
}: {
  text: string;
  base: number;
  stagger?: number;
  duration?: number;
  reduced: boolean | null;
  align?: "center" | "start";
  onComplete?: () => void;
}) {
  const words = text.split(" ");

  return (
    <span
      className={`inline-flex flex-wrap items-baseline gap-x-[0.28em] ${
        align === "start" ? "justify-start" : "justify-center"
      }`}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block -mb-[0.16em] overflow-hidden pb-[0.16em] align-bottom"
        >
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: "115%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={
              reduced
                ? { duration: 0 }
                : { delay: base + i * stagger, duration, ease: waveEase }
            }
            onAnimationComplete={
              i === words.length - 1 ? onComplete : undefined
            }
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
