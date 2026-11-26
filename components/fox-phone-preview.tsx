import { useId } from "react";
import { FoxBotAvatar } from "./fox-bot-avatar";
import { foxControlAlertSamples } from "./fox-control-alert-card";
import { FoxTypingBubble } from "./fox-typing-bubble";
import delivery from "./fox-chat-delivery.module.css";
import styles from "./fox-phone-preview.module.css";

function BotPortrait({ x, y, size }: { x: number; y: number; size: number }) {
  return <svg x={x} y={y} width={size} height={size} viewBox="0 0 32 32"><FoxBotAvatar /></svg>;
}

function PdfBubble() {
  return <g className={delivery.pdf}>
    <BotPortrait x={12} y={153} size={17} />
    <path d="M43 104h126q12 0 12 12v42q0 12-12 12H33l-5 1q5-5 5-11v-44q0-12 10-12Z" fill="white" />
    <circle cx="52" cy="124" r="12" fill="#389DD5" />
    <path d="M48 117h5l4 4v9h-9Z" fill="#fff" /><path d="M53 117v4h4" fill="none" stroke="#72BCE3" />
    <text x="70" y="122" fontSize="10.3" fill="#1875A4" fontWeight="650">Отчёт за смену.pdf</text>
    <text x="70" y="134" fontSize="8.3" fill="#657C88">1,8 МБ · PDF</text>
    <text x="41" y="150" fontSize="10.4">Ежедневный отчёт</text>
    <text x="41" y="162" fontSize="9" fill="#566877">Ресторан 01</text>
    <text x="174" y="162" className={styles.time}>08:55</text>
  </g>;
}

function AlertBubble() {
  const alert = foxControlAlertSamples.reduction;
  const [before, after, difference] = alert.rows;
  return <g className={delivery.notification}>
    <BotPortrait x={12} y={340} size={17} />
    <path d="M43 178h126q12 0 12 12v155q0 12-12 12H33l-5 1q5-5 5-11V190q0-12 10-12Z" fill="white" />
    <rect x="36" y="181" width="142" height="151" rx="8" fill="#F1EDF4" />
    <rect x="41" y="186" width="132" height="141" rx="7" fill="#FFF" />
    <text x="47" y="200" fontSize="7" fontWeight="700" letterSpacing=".35" fill="#6E6476">FOX / CONTROL</text>
    <text x="167" y="200" fontSize="7.3" textAnchor="end" fill="#766C7B">{alert.station}</text>
    <rect x="46" y="207" width="122" height="22" rx="4" fill="#F6F3F7" />
    <circle cx="57" cy="218" r="7" fill="#AA6986" />
    <text x="57" y="220.5" textAnchor="middle" fontWeight="650" fontSize="6" fill="#FFF">{alert.initials}</text>
    <text x="68" y="221" fontSize="8.7" fontWeight="600">{alert.role}</text>
    <text x="47" y="244" fontSize="9" fontWeight="600" fill="#985575">Уменьшение суммы</text>
    <text x="47" y="267" fontSize="21" fontWeight="650" letterSpacing="-.7" fill="#99496E">{difference.value}</text>
    {[before, after].map((row, index) => <g key={row.label} transform={`translate(0 ${index * 22})`}>
      <rect x="46" y="276" width="122" height="18" rx="3" fill="#F3EFF5" />
      <text x="51" y="288.5" fontSize="9" fill="#64596C">{row.label}</text>
      <text x="163" y="288.5" fontSize="10.5" textAnchor="end" fontWeight="600">{row.value}</text>
    </g>)}
    <text x="41" y="347" fontSize="10" fontWeight="500">ID DEMO-021</text>
    <text x="174" y="347" className={styles.time}>{alert.time}</text>
  </g>;
}

export function FoxPhonePreview() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `fox-phone-display-${id}`;
  const historyClipId = `fox-phone-history-${id}`;
  const patternId = `fox-phone-paper-${id}`;
  return <svg className={styles.phone} viewBox="0 0 200 420" role="img" aria-labelledby={`fox-phone-title-${id}`}>
    <title id={`fox-phone-title-${id}`}>Telegram на телефоне: ежедневный PDF-отчёт и уведомление Fox Control об уменьшении заказа на 620 рублей</title>
    <defs>
      <clipPath id={clipId}><rect x="10" y="8" width="180" height="403" rx="25" /></clipPath>
      <clipPath id={historyClipId}><rect x="10" y="98" width="180" height="265" /></clipPath>
      <pattern id={patternId} width="70" height="80" patternUnits="userSpaceOnUse">
        <g fill="none" stroke="#B7C9D5" strokeWidth="1" strokeLinejoin="round" opacity=".65">
          <path d="m8 18 16-6-4 13-5-4-3 3 .6-5 7-4-6 5Z" />
          <path d="m48 55 1.7-5 1.8 5 5 1.9-5 1.7-1.8 5-1.7-5-5-1.7Z" />
        </g>
      </pattern>
    </defs>
    <g fill="#6C6F72"><rect x="1" y="75" width="4" height="14" rx="2" /><rect x="1" y="98" width="4" height="37" rx="2" /><rect x="195" y="99" width="4" height="44" rx="2" /></g>
    <rect x="3" y="1" width="194" height="417" rx="31" fill="#A8ACB1" stroke="#777B81" strokeWidth="1.3" />
    <rect x="5.2" y="3.5" width="189.6" height="412" rx="29" fill="#15171A" />
    <g clipPath={`url(#${clipId})`}>
      <rect x="10" y="8" width="180" height="403" fill="#DCE7ED" />
      <rect x="10" y="73" width="180" height="329" fill={`url(#${patternId})`} />
      <text x="25" y="25" fontSize="9.5" fontWeight="700">20:24</text>
      <g fill="#25282D">
        <rect x="142" y="22" width="2" height="3" rx=".6" /><rect x="145" y="20" width="2" height="5" rx=".6" /><rect x="148" y="18" width="2" height="7" rx=".6" />
        <rect x="167" y="18" width="11" height="6" rx="1.2" /><rect x="178.8" y="20" width="1.3" height="2" rx=".6" />
      </g>
      <path d="M154 20q5-5 10 0m-8 2q3-3 6 0m-4 1.8 1.1 1 1.1-1" fill="none" stroke="#25282D" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="77" y="13" width="46" height="12" rx="6" fill="#15171A" />
      <circle cx="115" cy="19" r="2" fill="#273346" />
      <rect x="15" y="36" width="23" height="31" rx="12" fill="#FFF" />
      <path d="m28 47-4.8 4.8 4.8 4.8" stroke="#46535E" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="42" y="36" width="143" height="31" rx="14" fill="#FFF" />
      <BotPortrait x={46} y={39} size={25} />
      <text x="76" y="49.6" fontSize="12.7" fontWeight="650">Fox Control</text>
      <text x="76" y="60.2" fontSize="8.7" fill="#647887">бот</text>
      <g fill="#71808A"><circle cx="173" cy="47" r="1.2" /><circle cx="173" cy="51.5" r="1.2" /><circle cx="173" cy="56" r="1.2" /></g>
      <rect x="75" y="80" width="50" height="15" rx="7.5" fill="#839EAD" />
      <text x="100" y="90.5" textAnchor="middle" fontWeight="600" fontSize="8.8" fill="#FFF">Сегодня</text>
      <g clipPath={`url(#${historyClipId})`}>
        <FoxTypingBubble x={32} y={335} width={44} height={22} />
        <g className={delivery.stream}>
          <PdfBubble />
          <AlertBubble />
        </g>
      </g>
      <rect x="16" y="369" width="168" height="25" rx="12.5" fill="#FFF" />
      <path d="m26 379 4.5-4.4q3.1-2.4 5 0 1.5 2-.5 4l-6.4 6.4q-1.9 1.6-3.1.2-1.3-1.4.1-2.8l5.5-5.5" fill="none" stroke="#8193A0" strokeWidth="1.4" strokeLinecap="round" />
      <text x="42" y="385.6" fontSize="10.8" fill="#788A96">Сообщение</text>
      <circle cx="171" cy="381.5" r="9" fill="#349BD1" />
      <path d="m165 381 11.2-4-2.1 9-3.1-2.6-1.6 1.2.2-3.2 4.1-2.4-4.7 2.1Z" fill="#fff" />
      <rect x="76" y="403" width="48" height="2.4" rx="1.2" fill="#262C32" />
    </g>
  </svg>;
}
