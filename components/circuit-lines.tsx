"use client";

import { useId, type CSSProperties } from "react";
import { motion } from "framer-motion";

const lineEase = [0.22, 1, 0.36, 1] as const;

const LEFT_PATHS = [
  "M652.104 191.83 L189.915 191.83 C169.493 191.83 149.908 183.718 135.468 169.277 L0.353577 34.1631",
  "M652.641 158.577 L211.547 158.577 C191.126 158.577 171.54 150.465 157.1 136.025 L21.9859 0.91021",
  "M652.309 126.931 L237.074 126.931 C216.652 126.931 197.067 118.818 182.626 104.378 L78.6016 0.353554",
] as const;

const RIGHT_PATHS = [
  "M0.364545 0.91282 L156.771 167.521 C171.326 183.025 191.644 191.819 212.91 191.819 L643.412 191.819",
  "M51.8764 0.899102 L177.079 134.268 C191.633 149.772 211.952 158.566 233.218 158.566 L643.916 158.566",
  "M105.026 0.342216 L201.042 102.621 C215.597 118.125 235.915 126.92 257.181 126.92 L643.605 126.92",
] as const;

const DURS = [4.2, 4.85, 5.45];
const DELAYS = [-0.35, -1.85, -3.15];
const RESTS = ["38%", "54%", "68%"];
const LEFT_TURNS = ["64.6%", "63.5%", "66.5%"];
const RIGHT_STRAIGHTS = ["40.3%", "37.4%", "34.3%"];

type Side = "left" | "right";

function CircuitBoard({
  side,
  reduced,
}: {
  side: Side;
  reduced: boolean | null;
}) {
  const uid = useId().replace(/:/g, "");
  const isLeft = side === "left";
  const paths = isLeft ? LEFT_PATHS : RIGHT_PATHS;
  const vb = isLeft ? "0 0 652.641 192.33" : "0 0 643.916 192.319";
  const fadeId = `${uid}-fade`;

  return (
    <div className="absolute inset-0 overflow-visible">
      <svg
        viewBox={vb}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id={fadeId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F5F5ED" stopOpacity="0.08" />
            <stop offset="42%" stopColor="#F5F5ED" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#89827A" stopOpacity="0" />
          </linearGradient>
        </defs>

        {paths.map((d) => (
          <path key={d} d={d} stroke={`url(#${fadeId})`} strokeWidth="1" />
        ))}
      </svg>

      <div className="circuit-movers pointer-events-none absolute inset-0 overflow-visible">
        {paths.map((d, i) => (
          <span
            key={d}
            className={
              reduced
                ? "circuit-cap circuit-cap-static"
                : isLeft
                  ? "circuit-cap circuit-cap-top"
                  : "circuit-cap circuit-cap-bottom"
            }
            style={
              {
                offsetPath: `path("${d}")`,
                "--circuit-dur": `${DURS[i]}s`,
                "--circuit-delay": `${DELAYS[i]}s`,
                ...(isLeft
                  ? { "--circuit-turn": LEFT_TURNS[i] }
                  : { "--circuit-straight": RIGHT_STRAIGHTS[i] }),
                ...(reduced ? { offsetDistance: RESTS[i] } : null),
              } as CSSProperties & Record<string, string>
            }
          />
        ))}
      </div>
    </div>
  );
}

export function CircuitLines({
  side,
  delay = 0,
  reduced,
}: {
  side: Side;
  delay?: number;
  reduced: boolean | null;
}) {
  const lineDuration = reduced ? 0 : 0.9;
  const isLeft = side === "left";

  return (
    <div
      className={
        isLeft
          ? "absolute top-[-80.91px] left-[-21.99px] h-[191.477px] w-[652.287px]"
          : "absolute right-0 bottom-0 h-[191.477px] w-[643.552px]"
      }
    >
      <div className={isLeft ? "size-full" : "size-full -scale-y-100"}>
        <motion.div
          className="absolute inset-0 overflow-visible"
          initial={reduced ? false : { clipPath: "inset(-12px 100% -12px 0)" }}
          animate={{ clipPath: "inset(-12px 0% -12px 0)" }}
          transition={{ delay, duration: lineDuration, ease: lineEase }}
        >
          <CircuitBoard side={side} reduced={reduced} />
        </motion.div>
      </div>
    </div>
  );
}
