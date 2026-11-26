import Link from "next/link";
import { ArrowRight } from "./marketing-ui";
import styles from "./hero-actions.module.css";
import entry from "./hero-entrance.module.css";

export function HeroActions() {
  return (
    <div className={`hero-actions pointer-events-auto ${styles.actions} ${entry.actions}`}>
      <Link href="/#pricing" className="hero-project-link" data-button-reveal="">Подобрать сопровождение<ArrowRight /></Link>
      <Link href="/#products" className="hero-callback-link" data-button-reveal="">Наши продукты<ArrowRight /></Link>
    </div>
  );
}
