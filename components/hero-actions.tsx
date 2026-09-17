"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "./marketing-ui";
import { CallbackDialog } from "./callback-dialog";
import { ProjectDialog } from "./project-dialog";

export function HeroActions({ ready, reduced }: { ready: boolean; reduced: boolean }) {
  const [dialog, setDialog] = useState<"project" | "callback" | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>
    <motion.div className="hero-actions pointer-events-auto"
      initial={reduced ? false : { opacity: 0, scale: .86 }}
      animate={ready || reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: .86 }}
      transition={reduced ? { duration: 0 } : {
        scale: { type: "spring", stiffness: 260, damping: 18, mass: .8, delay: .08 },
        opacity: { delay: .08, duration: .24, ease: [.33, 1, .68, 1] },
      }}>
      <button type="button" className="hero-project-link" onClick={() => setDialog("project")} aria-haspopup="dialog">Запустить проект<ArrowRight /></button>
      <button type="button" className="hero-callback-link" onClick={() => setDialog("callback")} aria-haspopup="dialog">Заказать звонок</button>
    </motion.div>
    {mounted && createPortal(<><ProjectDialog open={dialog === "project"} onClose={() => setDialog(null)} /><CallbackDialog open={dialog === "callback"} onClose={() => setDialog(null)} /></>, document.body)}
  </>;
}
