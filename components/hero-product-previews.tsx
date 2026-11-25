import { foxControlAlertSamples } from "./fox-control-alert-card";
import { FlexBonusLogo } from "./flexbonus-logo";
import { UiIcon } from "./ui-icon";
import styles from "./hero-product-preview-content.module.css";

type PreviewProduct = "rezebra" | "flexbonus" | "foxcontrol";

const tables = [
  { number: 3, numeral: "M2.3 3.2C2.8 2.3 3.8 1.8 5 1.8c1.6 0 2.6.8 2.6 2s-1 2.1-2.6 2.1h-.5m.5 0c1.7 0 2.8.7 2.8 2.1s-1.1 2.2-2.8 2.2c-1.2 0-2.3-.5-2.8-1.4" },
  { number: 4, numeral: "M6.4 10.2V1.8L1.9 7.5h6.2" },
  { number: 5, numeral: "M7.5 1.8H2.7l-.4 4.1a3.4 3.4 0 0 1 2.6-1.1c1.8 0 2.9 1.1 2.9 2.7s-1.2 2.7-2.9 2.7c-1.2 0-2.1-.4-2.7-1.3" },
  { number: 6, numeral: "M7.5 3c-.5-.8-1.2-1.2-2.3-1.2-1.9 0-3 1.8-3 4.6 0 2.4 1 3.8 2.9 3.8 1.6 0 2.7-1.1 2.7-2.7S6.7 5 5.2 5C4 5 3 5.6 2.3 6.7" },
  { number: 7, numeral: "M2.2 1.8h5.6L3.9 10.2" },
  { number: 8, numeral: "M5 5.7c-1.5 0-2.5-.8-2.5-2S3.5 1.8 5 1.8s2.5.7 2.5 1.9S6.5 5.7 5 5.7Zm0 0c1.7 0 2.8.9 2.8 2.3S6.7 10.2 5 10.2 2.2 9.4 2.2 8 3.3 5.7 5 5.7Z" },
];

function ReservationPreview() {
  return <div className={styles.scene} aria-hidden="true">
    <div className={styles.composition}>
      <div className={styles.floorPlan}>
        <div className={styles.floorTables}>
          {tables.map(({ number, numeral }) => <span className={styles.tableSeat} key={number}>
            <span className={styles.table} data-round={number === 4 || number === 5} data-booked={number === 8}>
              <svg className={styles.tableNumber} viewBox="0 0 10 12" aria-label={String(number)}>
                <path d={numeral} />
              </svg>
            </span>
          </span>)}
        </div>
      </div>
      <div className={styles.reservationSlip}>
        <span className={`${styles.artLabel} ${styles.reservationStatus}`}>Бронь стола</span>
        <strong className={styles.artValue}>19:30</strong>
        <span className={styles.artLabel}>Стол 8 · 4 гостя</span>
      </div>
    </div>
  </div>;
}

function LoyaltyPreview() {
  return <div className={styles.scene} aria-hidden="true">
    <div className={styles.composition}>
      <div className={styles.memberPass}>
        <span className={styles.passLabel}><FlexBonusLogo symbolOnly />Карта гостя</span>
        <span className={styles.balance}><strong className={styles.artValue}>850</strong> баллов</span>
        <svg className={styles.barcode} viewBox="0 0 82 16" fill="currentColor">
          <path d="M0 0h2v16H0z M4 0h1v16H4z M7 0h3v16H7z M12 0h2v16h-2z M17 0h1v16h-1z M20 0h4v16h-4z M26 0h2v16h-2z M31 0h2v16h-2z M35 0h3v16h-3z M40 0h1v16h-1z M43 0h2v16h-2z M48 0h3v16h-3z M53 0h1v16h-1z M57 0h4v16h-4z M63 0h2v16h-2z M67 0h1v16h-1z M71 0h3v16h-3z M77 0h1v16h-1z M80 0h2v16h-2z" />
        </svg>
      </div>
      <div className={styles.coupon}>
        <div className={styles.couponMain}>
          <span className={styles.artLabel}>Купон</span>
          <strong className={styles.artValue}>−10%</strong>
        </div>
        <div className={styles.couponStub} />
      </div>
    </div>
  </div>;
}

function OperationsPreview() {
  const alert = foxControlAlertSamples.reduction;
  const [before, after, delta, operation] = alert.rows;

  return <div className={styles.scene} aria-hidden="true">
    <div className={styles.composition}>
      <div className={styles.receipt}>
        <strong className={styles.receiptHeading}>{alert.station}</strong>
        <dl className={styles.receiptTotals}>
          {[before, after].map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </div>
      <div className={styles.operationAlert}>
        <span className={styles.delta}>
          <UiIcon name="arrow-down" size={16} />
          <strong className={styles.artValue}>{delta.value}</strong>
        </span>
        <span className={styles.artLabel}>{operation.label}</span>
      </div>
    </div>
  </div>;
}

export function HeroProductPreview({ product }: { product: PreviewProduct }) {
  if (product === "rezebra") return <ReservationPreview />;
  if (product === "flexbonus") return <LoyaltyPreview />;
  return <OperationsPreview />;
}
