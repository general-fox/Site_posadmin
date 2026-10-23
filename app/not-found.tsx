import Link from "next/link";
import { ServiceArrow, ServicePageFrame } from "@/components/service-page-frame";
import styles from "@/components/service-pages.module.css";

export default function NotFound() {
  return <ServicePageFrame page="other">
    <div className={`${styles.shell} ${styles.intro}`}>
      <p className={styles.eyebrow}>404</p>
      <h1 className={styles.title}>Этой страницы нет</h1>
      <p className={styles.lead}>Возможно, адрес изменился. Посмотрите, как мы запускаем заведения с нуля, или вернитесь на главную.</p>
      <div className={styles.actions}>
        <Link className={styles.button} href="/#launch">Запуск с нуля <ServiceArrow /></Link>
        <Link className={styles.textLink} href="/">На главную</Link>
      </div>
    </div>
  </ServicePageFrame>;
}
