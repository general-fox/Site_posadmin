import { UiIcon } from "./ui-icon";
import styles from "./marketing.module.css";

export function ProductIntegration() {
  return <span className={styles.productIntegration}>
    <UiIcon name="check" size={15} />
    <span>Работает напрямую с r_keeper</span>
  </span>;
}
