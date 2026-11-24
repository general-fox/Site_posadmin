import { foxControlAlertSamples } from "./fox-control-alert-card";
import { FlexBonusLogo } from "./flexbonus-logo";
import styles from "./hero-product-preview-content.module.css";

type PreviewProduct = "rezebra" | "flexbonus" | "foxcontrol";

const tables = [
  { x: 22, y: 19, round: false }, { x: 55, y: 19, round: true },
  { x: 89, y: 19, round: false }, { x: 122, y: 19, round: true },
  { x: 22, y: 48, round: true }, { x: 55, y: 48, round: false },
  { x: 89, y: 48, round: true }, { x: 122, y: 48, round: false },
];

function ReservationPlan() {
  return <svg className={styles.plan} viewBox="0 0 144 68" fill="none" focusable="false">
    <path d="M63 63H5V5h134v58H82" stroke="#697075" strokeWidth="1.4" strokeLinejoin="round" />
    {tables.map(({ x, y, round }, index) =>
      <g key={index} transform={`translate(${x} ${y})`}>
        <path d="M-3-8h6M-3 8h6" stroke="#acb4ba" strokeWidth="2.5" strokeLinecap="round" />
        {round
          ? <circle r="5.4" fill="#9bd99a" />
          : <rect x="-8.5" y="-5" width="17" height="10" rx="2.5" fill="#9bd99a" />}
        {index === 7 && <g className={styles.selection}>
          <rect x="-12" y="-9" width="24" height="18" rx="5" stroke="#a9cfff" strokeWidth="1.2" />
          <rect x="-8.5" y="-5" width="17" height="10" rx="2.5" fill="#4f96ef" />
          <path d="m-3 0 2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>}
      </g>
    )}
  </svg>;
}

export function HeroProductPreview({ product }: { product: PreviewProduct }) {
  if (product === "rezebra") {
    return <div className={`${styles.sample} ${styles.reservation}`} aria-hidden="true">
      <div className={styles.metric}>
        <span>Бронь стола</span><strong>19:30</strong><span>Стол 8 · 4 гостя</span>
      </div>
      <ReservationPlan />
    </div>;
  }

  if (product === "flexbonus") {
    return <div className={styles.loyalty} aria-hidden="true">
      <div className={styles.pass}>
        <div className={styles.member}>
          <span className={styles.passLabel}><FlexBonusLogo symbolOnly />Карта гостя</span>
          <span className={styles.balance}><strong>850</strong> баллов</span>
          <span className={styles.barcode} />
        </div>
        <dl className={styles.benefits}>
          <div><dt>Купон</dt><dd>−10%</dd></div>
          <div><dt>Сертификат</dt><dd>1 000 ₽</dd></div>
        </dl>
      </div>
    </div>;
  }

  const alert = foxControlAlertSamples.reduction;
  const [before, after, delta] = alert.rows;
  return <div className={`${styles.sample} ${styles.receipt}`} aria-hidden="true">
    <div className={styles.metric}>
      <span>{alert.station} · {alert.time}</span><strong>{delta.value}</strong><span>Перенос позиции</span>
    </div>
    <dl className={styles.comparison}>
      {[before, after].map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
    </dl>
  </div>;
}
