import { useId } from "react";
import { FoxDesktopChat } from "./fox-desktop-chat";
import { FoxPhonePreview } from "./fox-phone-preview";
import { ProductPreviewScene } from "./product-preview-frame";
import styles from "./fox-control-telegram.module.css";

function Laptop() {
  const id = useId().replace(/:/g, "");
  return <div className={styles.laptop}>
    <svg className={styles.hardware} viewBox="0 0 1000 624" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2=".1">
          <stop stopColor="#8e939a" /><stop offset=".08" stopColor="#dde0e4" />
          <stop offset=".5" stopColor="#c8ccd1" /><stop offset=".92" stopColor="#dfe2e6" /><stop offset="1" stopColor="#9399a2" />
        </linearGradient>
        <linearGradient id={`${id}-lip`} x2="0" y2="1">
          <stop stopColor="#e1e3e7" /><stop offset=".65" stopColor="#acb1ba" /><stop offset="1" stopColor="#7c838c" />
        </linearGradient>
        <pattern id={`${id}-keys`} width="27" height="7" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="24.5" height="4.7" rx="1.5" fill="#51565d" />
        </pattern>
      </defs>
      <rect x="74" y="4" width="852" height="551" rx="21" fill={`url(#${id}-metal)`} />
      <rect x="77" y="7" width="846" height="546" rx="18" fill="#212327" />
      <circle cx="500" cy="14" r="3.2" fill="#101114" />
      <circle cx="500" cy="14" r="1.5" fill="#354758" />
      <path d="M79 549h842l76 45q4 3 1 5H2q-3-2 1-5Z" fill={`url(#${id}-metal)`} />
      <path d="M130 550h740l8 4H122Z" fill="#6a7077" />
      <path d="M146 558h708l35 19H111Z" fill={`url(#${id}-keys)`} />
      <path d="M439 581h122l9 11H430Z" fill="#c6cacf" stroke="#a6abb2" strokeWidth="1.2" />
      <path d="M1 597h998c-3 10-21 17-41 17H42c-20 0-38-7-41-17Z" fill={`url(#${id}-lip)`} />
      <path d="M434 597h132q-3 5-11 5H445q-8 0-11-5Z" fill="#8d9299" />
    </svg>
    <div className={styles.laptopScreen}><FoxDesktopChat /></div>
  </div>;
}

export function FoxControlTelegram() {
  return <ProductPreviewScene className={styles.devices} label="Fox Control в Telegram на ноутбуке и телефоне. Пример отчёта и уведомлений о кассовых операциях.">
    <Laptop />
    <div className={styles.phone}><FoxPhonePreview /></div>
  </ProductPreviewScene>;
}
