import { FoxBotAvatar } from "./fox-bot-avatar";
import { foxControlAlertSamples } from "./fox-control-alert-card";
import { FoxTypingBubble } from "./fox-typing-bubble";
import delivery from "./fox-chat-delivery.module.css";
import styles from "./fox-desktop-chat.module.css";

const iconPaths = {
  menu: "M3 5h14M3 10h14M3 15h14",
  search: "M14 9a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-1.5 4 4 4",
  saved: "M5 3h10v14l-5-3-5 3V3Z",
  crew: "M12.5 7a2.7 2.7 0 1 1-5.4 0 2.7 2.7 0 0 1 5.4 0ZM4 16a6 6 0 0 1 12 0",
  file: "M5 2.5h6.5l3.5 4v11H5v-15ZM11 3v4h4M7.5 11h5M7.5 13.5h4",
  clip: "m7.3 10.9 4.8-5a2 2 0 1 1 3 2.8l-6.3 6.6A3.5 3.5 0 0 1 3.7 11l7.1-7.5",
  mic: "M7.5 5.5a2.5 2.5 0 0 1 5 0v4a2.5 2.5 0 0 1-5 0v-4ZM5 9a5 5 0 0 0 10 0M10 14v3m-3 0h6",
};

function ChatIcon({ name }: { name: keyof typeof iconPaths }) {
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={iconPaths[name]} />
  </svg>;
}

function ChatList() {
  return <aside className={styles.sidebar} aria-hidden="true">
    <div className={styles.searchBar}><ChatIcon name="menu" /><span>Поиск</span></div>
    <div className={`${styles.row} ${styles.active}`}>
      <span className={styles.avatar}><FoxBotAvatar /></span>
      <div className={styles.rowText}><strong>Fox Control</strong><span>Уведомление об операции</span></div>
    </div>
    <div className={styles.row}>
      <span className={`${styles.avatar} ${styles.team}`}><ChatIcon name="crew" /></span>
      <div className={styles.rowText}><strong>Команда</strong><span>Смена открыта</span></div>
    </div>
    <div className={styles.row}>
      <span className={`${styles.avatar} ${styles.saved}`}><ChatIcon name="saved" /></span>
      <div className={styles.rowText}><strong>Избранное</strong><span>Сохранённые сообщения</span></div>
    </div>
  </aside>;
}

export function FoxDesktopChat() {
  const operation = foxControlAlertSamples.reduction;
  const totals = operation.rows.slice(0, 3);
  return <div className={styles.screen}>
    <div className={styles.app}>
      <ChatList />
      <section className={styles.dialog} aria-label="Чат Fox Control в Telegram на ноутбуке">
        <header className={styles.header}>
          <div><h4>Fox Control</h4><span>бот</span></div>
          <span className={styles.tools} aria-hidden="true"><ChatIcon name="search" /><i /></span>
        </header>
        <div className={styles.history} data-preview-playback-target="foxcontrol">
          <span className={styles.day}>Сегодня</span>
          <div className={styles.thread}>
            <FoxTypingBubble className={styles.typingBubble} />
            <ol className={`${styles.messages} ${delivery.stream}`}>
              <li className={`${styles.bubble} ${delivery.pdf}`}>
                <div className={styles.file}>
                  <span className={styles.fileMark}><ChatIcon name="file" /></span>
                  <div><strong>Отчёт за смену.pdf</strong><span>Документ PDF</span></div>
                </div>
                <div className={styles.caption}><span>Ресторан 01</span><time dateTime="08:55">08:55</time></div>
              </li>
              <li className={`${styles.bubble} ${delivery.notification}`}>
                <div className={styles.alert}>
                  <div className={styles.alertHeading}><b>FOX / CONTROL</b><span>{operation.station}</span></div>
                  <strong>{operation.title}</strong>
                  <dl>{totals.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                </div>
                <div className={styles.caption}><span>{operation.role}</span><time dateTime={operation.time}>{operation.time}</time></div>
              </li>
            </ol>
          </div>
        </div>
        <div className={styles.composer} aria-hidden="true"><ChatIcon name="clip" /><span>Сообщение</span><ChatIcon name="mic" /></div>
      </section>
    </div>
  </div>;
}
