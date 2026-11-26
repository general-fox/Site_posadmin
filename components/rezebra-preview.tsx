"use client";

import { ProductPreviewFrame } from "./product-preview-frame";
import { ReZebraPlannerScreen } from "./rezebra-planner-screen";

export function ReZebraPreview() {
  return <ProductPreviewFrame
    device="tablet"
    title="Rezebra"
    label="План зала и бронирования в Rezebra на планшете хостес"
  >
    {(phase) => <ReZebraPlannerScreen phase={phase} />}
  </ProductPreviewFrame>;
}
