"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "./marketing-ui";
import { CallbackDialog } from "./callback-dialog";
import styles from "./hero-actions.module.css";

export function HeroActions({ reduced }: { reduced: boolean }) {
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>
    <motion.div className={`hero-actions pointer-events-auto ${styles.actions}`}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { delay: 1.35, duration: .65, ease: [.33, 1, .68, 1] }}>
      <Link href="/#pricing" className="hero-project-link">Подобрать сопровождение<ArrowRight /></Link>
      <button type="button" className="hero-callback-link" onClick={() => setCallbackOpen(true)} aria-haspopup="dialog">Запросить звонок</button>
    </motion.div>
    {mounted && createPortal(<CallbackDialog open={callbackOpen} chooseSpecialist onClose={() => setCallbackOpen(false)} />, document.body)}
  </>;
}
