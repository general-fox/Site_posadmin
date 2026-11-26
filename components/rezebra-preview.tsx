"use client";

import { ProductPreviewFrame } from "./product-preview-frame";
import { ReZebraPlannerScreen } from "./rezebra-planner-screen";
import styles from "./rezebra-preview.module.css";

export function ReZebraPreview() {
  return <ProductPreviewFrame
    title="Rezebra"
    label="Планировщик Rezebra: схема зала, выбор стола и подтверждение бронирования. Данные приведены для примера."
  >
    <div className={styles.screen}>
      <ReZebraPlannerScreen demonstration />
    </div>
  </ProductPreviewFrame>;
}
