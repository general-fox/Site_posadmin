import { foxControlAlertSamples } from "./fox-control-alert-card";
import { ProductPreviewFrame } from "./product-preview-frame";
import styles from "./fox-control-telegram.module.css";

const operations = [
  { kind: "reduction", title: "Уменьшение суммы", detail: "2 740 ₽ → 2 120 ₽", amount: "−620 ₽" },
  { kind: "deletion", title: "Удаление позиции", detail: "Горячее блюдо", amount: "−790 ₽" },
] as const;

function FoxMark() {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="m5 5 8 5h6l8-5-2 15-9 8-9-8L5 5Z" fill="currentColor" />
    <path d="m9 15 7 5 7-5-3 8-4 3-4-3-3-8Z" fill="#FFFFFF" />
    <path d="m14 21 2 2 2-2h-4Z" fill="currentColor" />
  </svg>;
}

function TelegramMark() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m21 4-4 17-6-5-3 3 1-6-6-3L21 4Z" fill="currentColor" />
    <path d="m9 13 8-6-6 9" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function ChatSidebar() {
  return <aside className={styles.sidebar} aria-hidden="true">
    <div className={styles.sidebarTitle}><TelegramMark /><span>Telegram</span></div>
    <div className={styles.search}><span>⌕</span> Поиск</div>
    <div className={`${styles.chatItem} ${styles.selectedChat}`}>
      <span className={styles.avatar}><FoxMark /></span>
      <div><strong>Fox Control</strong><span>Отчёт за смену</span></div>
      <span className={styles.unread}>3</span>
    </div>
    <div className={styles.chatItem}>
      <span className={`${styles.avatar} ${styles.teamAvatar}`}>Р</span>
      <div><strong>Команда</strong><span>Рабочий чат</span></div>
    </div>
    <div className={styles.chatItem}>
      <span className={`${styles.avatar} ${styles.savedAvatar}`}>✓</span>
      <div><strong>Избранное</strong><span>Важное под рукой</span></div>
    </div>
    <p className={styles.sidebarNote}>События ресторана<br />в привычном чате</p>
  </aside>;
}

function ReportMessage() {
  return <li className={`${styles.message} ${styles.report}`}>
    <span className={styles.fileIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M6 3h8l4 4v14H6V3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M14 3v5h4M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
    <div className={styles.reportCopy}><strong>Отчёт за смену.pdf</strong><span>Выручка и операции за день · PDF</span></div>
    <time dateTime="20:40">20:40</time>
  </li>;
}

export function FoxControlTelegram() {
  return <ProductPreviewFrame title="Telegram · Fox Control" label="Демонстрационный чат Fox Control: уведомления об операциях и отчёт в PDF. Данные вымышлены.">
    <div className={styles.window}>
      <div className={styles.layout}>
        <ChatSidebar />
        <section className={styles.chat} aria-label="Пример чата Fox Control">
          <header className={styles.header}>
            <span className={styles.avatar} aria-hidden="true"><FoxMark /></span>
            <div><h4>Fox Control</h4><p>Ресторан 01 · уведомления об операциях</p></div>
            <span className={styles.headerDots} aria-hidden="true">···</span>
          </header>
          <div className={styles.conversation}>
            <p className={styles.date}>Сегодня <span>· пример данных</span></p>
            <ol className={styles.messages}>
              {operations.map(({ kind, title, detail, amount }) => {
                const operation = foxControlAlertSamples[kind];
                return <li key={kind} className={styles.message}>
                  <div className={styles.messageHeading}><strong>{title}</strong><time dateTime={operation.time}>{operation.time}</time></div>
                  <div className={styles.operation}><span>{detail}</span><b>{amount}</b></div>
                  <p className={styles.operationMeta}>{operation.station} · {operation.role}</p>
                </li>;
              })}
              <ReportMessage />
            </ol>
          </div>
          <div className={styles.composer} aria-hidden="true"><span>Сообщение</span><TelegramMark /></div>
        </section>
      </div>
    </div>
  </ProductPreviewFrame>;
}
