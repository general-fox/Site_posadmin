"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const WORDS = ["ресторанов", "баров", "кафе"] as const;
const HOLD_MS = 2400;
const flipEase = [0.33, 1, 0.68, 1] as const;

export function FlipWords({
  reduced,
  base,
  duration,
  onFirstComplete,
}: {
  reduced: boolean | null;
  base: number;
  duration: number;
  onFirstComplete?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [cycling, setCycling] = useState(false);
  const visible = useRef(true);
  const hostRef = useRef<HTMLSpanElement>(null);
  const onFirstCompleteRef = useRef(onFirstComplete);
  onFirstCompleteRef.current = onFirstComplete;

  useEffect(() => {
    if (reduced) {
      onFirstCompleteRef.current?.();
      return;
    }

    const startTimer = window.setTimeout(() => {
      onFirstCompleteRef.current?.();
      setCycling(true);
    }, (base + duration) * 1000 + 400);

    return () => window.clearTimeout(startTimer);
  }, [base, duration, reduced]);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry?.isIntersecting ?? true;
      },
      { threshold: 0.2 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !cycling) return;

    const tick = () => {
      if (document.hidden || !visible.current) return;
      setIndex((current) => (current + 1) % WORDS.length);
    };

    const id = window.setInterval(tick, HOLD_MS);
    return () => window.clearInterval(id);
  }, [cycling, reduced]);

  const word = WORDS[index];

  if (reduced) {
    return <span>{WORDS[0]}</span>;
  }

  return (
    <span ref={hostRef} className="relative inline-block align-bottom">
      <span className="invisible whitespace-nowrap" aria-hidden>
        {WORDS[0]}
      </span>
      <span className="absolute inset-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={word}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
            initial={{ y: "115%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-115%", opacity: 0 }}
            transition={
              cycling
                ? { duration: 0.55, ease: flipEase }
                : { delay: base, duration, ease: flipEase }
            }
          >
            {word}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
