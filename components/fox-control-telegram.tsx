import { FoxControlAlertCard, foxControlAlertSamples } from "./fox-control-alert-card";
import styles from "./fox-control-telegram.module.css";

const alertMessages = [
  { kind: "reduction", id: "DEMO-021" },
  { kind: "payment", id: "DEMO-022" },
] as const;

const sceneAlerts = [
  { kind: "reduction", position: styles.nearAlert, shortTitle: "Уменьшение суммы", inChat: true },
  { kind: "payment", position: styles.farAlert, shortTitle: "Изменения после оплаты", inChat: true },
  { kind: "deletion", position: styles.middleAlert, shortTitle: "Удаление позиции", inChat: false },
] as const;

const phoneFrameSizes = "auto, (max-width: 767px) and (orientation: portrait) min(calc(35vw - 28px), 208px), 208px";
const phoneFrameAvif = [
  "/products/fox-control-iphone-240.avif 240w",
  "/products/fox-control-iphone-420.avif 420w",
  "/products/fox-control-iphone-590.avif 590w",
].join(", ");
const phoneFrameWebp = [
  "/products/fox-control-iphone-240.webp 240w",
  "/products/fox-control-iphone-420.webp 420w",
  "/products/fox-control-iphone-590.webp 590w",
].join(", ");

function FoxMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m5 5 8 5h6l8-5-2 15-9 8-9-8L5 5Z" fill="currentColor" />
      <path d="m9 15 7 5 7-5-3 8-4 3-4-3-3-8Z" fill="#FFFFFF" />
      <path d="m14 21 2 2 2-2h-4Z" fill="currentColor" />
    </svg>
  );
}

function PhoneStatus() {
  return (
    <div className={styles.phoneStatus} aria-hidden="true">
      <span>9:41</span>
      <svg viewBox="0 0 62 14" fill="none">
        <path d="M2 10v2m4-5v5m4-8v8m4-11v11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M22 5a9 9 0 0 1 12 0m-10 3a6 6 0 0 1 8 0m-6 3a3 3 0 0 1 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <rect x="42" y="3" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <rect x="44" y="5" width="12" height="5" rx="1" fill="currentColor" />
        <path d="M60 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SenderAvatar() {
  return <span className={styles.senderAvatar} aria-hidden="true"><FoxMark /></span>;
}

function ReportMessage() {
  return (
    <div className={styles.messageRow}>
      <SenderAvatar />
      <div className={`${styles.messageBubble} ${styles.reportMessage}`}>
        <div className={styles.fileSummary}>
          <span className={styles.fileIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M7 3h6l5 5v13H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" fill="currentColor" />
              <path d="M13 3v6h5" stroke="#2478B0" strokeLinejoin="round" />
            </svg>
          </span>
          <div><strong>Пример отчёта.pdf</strong><span>PDF</span></div>
        </div>
        <div className={styles.reportMeta}>
          <span>Ежедневный отчёт · Ресторан 01</span>
          <time className={styles.messageTime} dateTime="08:40">08:40</time>
        </div>
      </div>
    </div>
  );
}

function PhoneChat() {
  return (
    <div className={styles.phone}>
      <svg className={styles.phoneCaseFallback} viewBox="0 0 590 1308" aria-hidden="true" focusable="false">
        <path d="M95 19L474 5C534 1 573 31 584 103V1190C582 1252 546 1294 474 1304L100 1290C39 1287 8 1247 8 1185V132C9 61 39 26 95 19Z" fill="#17191C" />
      </svg>
      <picture className={styles.phoneCase}>
        <source type="image/avif" srcSet={phoneFrameAvif} sizes={phoneFrameSizes} />
        {/* Static responsive sources also work without Next's image optimizer. */}
        <img
          src="/products/fox-control-iphone-420.webp"
          srcSet={phoneFrameWebp}
          sizes={phoneFrameSizes}
          alt=""
          width={590}
          height={1308}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </picture>
      <div className={styles.screenMask}>
        <div className={styles.chat}>
          <div className={styles.chatTop}>
            <PhoneStatus />
            <div className={styles.chatHeader}>
              <svg className={styles.backIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m12 5-7 7 7 7M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className={styles.chatIdentity}>
                <span className={styles.chatAvatar}><FoxMark /></span>
                <div>
                  <p>Fox Control</p>
                  <span>Уведомления об операциях</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.conversation}>
            <ReportMessage />
            {alertMessages.map(({ kind, id }) => {
              const { time } = foxControlAlertSamples[kind];
              return (
                <div className={styles.messageRow} key={kind}>
                  <SenderAvatar />
                  <div className={`${styles.messageBubble} ${styles.alertMessage}`}>
                    <FoxControlAlertCard kind={kind} />
                    <div className={styles.messageMeta}>
                      <span>ID {id}</span>
                      <time className={styles.messageTime} dateTime={time}>{time}</time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.composer} aria-hidden="true">
            <span className={styles.composerField}>Сообщение</span>
            <span className={styles.sendIcon}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="m20 4-6 16-4-7-7-4 17-5Z" fill="currentColor" />
                <path d="m10 13 6-5" stroke="#2478B0" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </span>
            <span className={styles.homeIndicator} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FoxControlTelegram() {
  return (
    <figure className={styles.preview} aria-label="Примеры уведомлений Fox Control в Telegram. Данные вымышлены.">
      <div className={styles.composition}>
        <PhoneChat />
        {sceneAlerts.map(({ kind, position, shortTitle, inChat }) => (
          <div key={kind} className={`${styles.sideCard} ${position}`} aria-hidden={inChat || undefined}>
            <FoxControlAlertCard kind={kind} />
            <div className={styles.compactAlert}>
              <strong>{shortTitle}</strong>
              <time dateTime={foxControlAlertSamples[kind].time}>{foxControlAlertSamples[kind].time}</time>
            </div>
          </div>
        ))}
      </div>
    </figure>
  );
}
