"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "./marketing-ui";
import styles from "./hero-actions.module.css";

export function HeroActions({ reduced }: { reduced: boolean }) {
  return (
    <motion.div className={`hero-actions pointer-events-auto ${styles.actions}`}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { delay: .55, duration: .55, ease: [.33, 1, .68, 1] }}>
      <Link href="/#pricing" className="hero-project-link">Подобрать сопровождение<ArrowRight /></Link>
      <Link href="/#products" className="hero-callback-link">Наши продукты<ArrowRight /></Link>
    </motion.div>
  );
}
