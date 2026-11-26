import { FlexBonusLogo } from "./flexbonus-logo";
import { ProductPreviewFrame } from "./product-preview-frame";
import styles from "./flexbonus-preview.module.css";

// Fictional data only: the customer's screenshot is not shipped with the site.
const metrics = [
  ["Сумма покупок", "2 484 000", "₽"],
  ["Заказы", "432", ""],
  ["Средний чек", "5 750", "₽"],
  ["Новые клиенты", "64", ""],
] as const;
const purchases = [24, 18, 35, 29, 48, 33, 25, 41, 36, 66, 49, 38, 53, 43, 31, 57, 46, 72, 61, 50, 44, 59, 78, 64, 51, 70, 90, 76, 63, 82];
const navigation = ["Дашборд", "Отчёты", "Клиенты", "Сегменты", "Счета", "Заказы", "Подписки", "Сертификаты", "Купоны"];

function DashboardIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2" width="4" height="4" rx="1" fill="currentColor" /><rect x="10" y="2" width="4" height="4" rx="1" fill="currentColor" /><rect x="2" y="10" width="4" height="4" rx="1" fill="currentColor" /><rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" /></svg>;
}

export function FlexBonusPreview() {
  return <ProductPreviewFrame title="Flexbonus" label="Демонстрационный интерфейс Flexbonus: динамика покупок и бонусный баланс">
    <div className={styles.window}>
      <aside className={styles.sidebar} aria-hidden="true">
        <div className={styles.brand}><FlexBonusLogo className={styles.logo} /></div>
        <div className={styles.menu}>
          <p>Управление</p>
          {navigation.map((item, index) => <span key={item} className={index === 0 ? styles.current : undefined}>{index === 0 && <DashboardIcon />}{item}</span>)}
          <p>Администрирование</p>
          <span>Программы</span><span>Типы счетов</span><span>Объекты</span>
        </div>
        <div className={styles.profile}><span>А</span><div>Администратор</div></div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}><FlexBonusLogo className={styles.logo} /><span>Администратор</span></div>
        <header className={styles.header}>
          <div><h4>Обзор лояльности</h4><p>Последние 30 дней</p></div>
        </header>

        <dl className={styles.metrics}>
          {metrics.map(([label, value, unit], index) => <div key={label} style={{ animationDelay: `${index * 90}ms` }}><dt><span className={styles.fullLabel}>{label}</span><span className={styles.compactLabel}>{["Покупки", "Заказы", "Ср. чек", "Новые клиенты"][index]}</span></dt><dd>{value}{unit && <span> {unit}</span>}</dd></div>)}
        </dl>

        <div className={styles.analytics}>
          <section className={styles.chart} aria-label="Пример динамики покупок за 30 дней">
            <div className={styles.panelHeading}><h5>Динамика покупок</h5><span>Сумма</span></div>
            <p className={styles.panelHint}>Оплаченные заказы</p>
            <div className={styles.bars} aria-hidden="true">{purchases.map((height, index) => <span key={index} style={{ height: `${height}%`, animationDelay: `${280 + index * 28}ms` }} />)}</div>
            <div className={styles.chartAxis} aria-hidden="true"><span>Начало периода</span><span>Сегодня</span></div>
            <div className={styles.chartSummary}><span><strong>286</strong> счетов с покупками</span><span><strong>48%</strong> с повторной покупкой</span></div>
          </section>

          <section className={styles.bonuses} aria-label="Пример бонусного баланса">
            <div className={styles.panelHeading}><h5>Бонусы</h5><span>30 дней</span></div>
            <div className={styles.balance}><span>Текущий баланс счетов</span><p>24 600 <span>б.</span></p></div>
            <dl><div><dt>Начислено</dt><dd>8 400 б.</dd></div><div><dt>Списано</dt><dd>5 200 б.</dd></div><div><dt>Сгорело</dt><dd>600 б.</dd></div></dl>
          </section>
        </div>
      </div>
    </div>
  </ProductPreviewFrame>;
}
