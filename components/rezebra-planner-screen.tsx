import { useEffect, useId, useState } from "react";
import type { PreviewPhase } from "./product-preview-frame";
import { UiIcon } from "./ui-icon";
import styles from "./rezebra-preview.module.css";

const tables = [
  { number: 15, x: 73, y: 103, late: true },
  { number: 16, x: 223, y: 103, round: true, booking: { guest: "Анна Орлова", time: "17:52", guests: "2 гостя", note: "Стол у окна" } },
  { number: 17, x: 375, y: 103, booking: { guest: "Илья Миронов", time: "20:20", guests: "4 гостя", note: "Постоянный гость" } },
  { number: 18, x: 525, y: 103 },
  { number: 19, x: 73, y: 193, round: true, late: true },
  { number: 20, x: 223, y: 193 },
  { number: 21, x: 375, y: 193 },
  { number: 22, x: 525, y: 193, round: true },
  { number: 23, x: 223, y: 280 },
  { number: 24, x: 375, y: 280 },
];

type TableProps = (typeof tables)[number];

const demoTable = 17;

function Table({ table, selected, pressSequence, panelId, onSelect }: {
  table: TableProps;
  selected: boolean;
  pressSequence?: number;
  panelId: string;
  onSelect: (number: number) => void;
}) {
  const { number, x, y, round, booking, late } = table;
  const halfWidth = round ? 24 : 38;
  const halfHeight = round ? 24 : 19;
  const shape = { x: -halfWidth, y: -halfHeight, width: halfWidth * 2, height: halfHeight * 2, rx: round ? halfWidth : 5 };

  return <g transform={`translate(${x} ${y})`}>
    <g key={pressSequence ?? "idle"} className={styles.tableArt} data-demo={number === demoTable} data-pressed={pressSequence !== undefined}>
      <g className={styles.tableFace}>
        <g fill="#BFC7D0">
          <rect x="-6" y={-halfHeight - 4} width="12" height="7" rx="3.5" />
          <rect x="-6" y={halfHeight - 3} width="12" height="7" rx="3.5" />
          <rect x={-halfWidth - 4} y="-6" width="7" height="12" rx="3.5" />
          <rect x={halfWidth - 3} y="-6" width="7" height="12" rx="3.5" />
        </g>
        <rect {...shape} fill="#92EB90" stroke="#292C29" />
        {late && <rect x={shape.x - 4} y={shape.y - 4} width={shape.width + 8} height={shape.height + 8} rx={shape.rx + 4} fill="none" stroke="#8DD7B5" strokeWidth="1.5" strokeDasharray="2 3" />}
        {booking && <g>
          <rect {...shape} fill="#FF8582" stroke="#392C30" />
          <text className={round ? styles.roundTime : styles.time} y="1">{booking.time}</text>
        </g>}
        {late && <g>
          {!round && <text fontSize="12" y="-7">Опаздывает</text>}
          <text className={round ? styles.roundTime : styles.time} y={round ? 1 : 9}>04:47</text>
        </g>}
      </g>
      {booking && <g transform="translate(8 5)" pointerEvents="none" aria-hidden="true">
        <circle className={styles.tapWave} r="12" />
        <circle className={styles.tapPoint} r="6" />
      </g>}
    </g>
    <text className={styles.tableNumber} x={-halfWidth + 2} y={-halfHeight - 12} fill="#F6F7F8" textAnchor="start">{number}</text>
    {booking && <g
      className={styles.tableButton}
      id={`${panelId}-table-${number}`}
      role="button"
      tabIndex={0}
      aria-label={`Бронь стола ${number} на ${booking.time}`}
      aria-expanded={selected}
      aria-controls={panelId}
      onClick={() => onSelect(number)}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (!event.repeat) onSelect(number);
      }}
    >
      <rect x="-55" y="-40" width="110" height="84" fill="transparent" />
      <rect className={styles.selectionRing} x={-halfWidth - 6} y={-halfHeight - 6}
        width={shape.width + 12} height={shape.height + 12} rx={shape.rx + 6} />
    </g>}
  </g>;
}

export function ReZebraPlannerScreen({ phase }: { phase: PreviewPhase }) {
  const titleId = useId();
  const descriptionId = useId();
  const panelId = useId();
  const [detail, setDetail] = useState<{ number: number; open: boolean } | null>(null);
  const [tap, setTap] = useState<{ number: number; sequence: number; keepPlanInset: boolean } | null>(null);
  const [demoReady, setDemoReady] = useState(false);
  const open = detail?.open ?? (demoReady || phase === "settled");
  const planInset = open || (tap?.keepPlanInset ?? false);
  const number = detail?.number ?? demoTable;
  const table = tables.find((item) => item.number === number);

  useEffect(() => {
    if (detail || phase !== "playing") return;
    const timer = window.setTimeout(() => setDemoReady(true), 1400);
    return () => window.clearTimeout(timer);
  }, [phase, detail]);

  useEffect(() => {
    if (!tap) return;
    const timer = window.setTimeout(() => setDetail({ number: tap.number, open: true }), 480);
    return () => window.clearTimeout(timer);
  }, [tap]);

  const pressTable = (next: number) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTap(null);
      setDetail({ number: next, open: true });
      return;
    }
    setDetail({ number, open: false });
    setTap((previous) => ({ number: next, sequence: (previous?.sequence ?? 0) + 1, keepPlanInset: planInset }));
  };

  const closePanel = () => {
    document.getElementById(`${panelId}-table-${tap?.number ?? number}`)?.focus({ preventScroll: true });
    setTap(null);
    setDetail({ number, open: false });
  };

  return <div className={styles.scene} data-manual={detail !== null} data-plan-inset={planInset} onKeyDown={(event) => {
    if (event.key === "Escape" && (open || tap)) closePanel();
  }}>
    <svg className={styles.plan} viewBox="0 0 600 376" role="group" aria-labelledby={titleId} aria-describedby={descriptionId} xmlns="http://www.w3.org/2000/svg">
      <title id={titleId}>Зал Rezebra в тёмной теме</title>
      <desc id={descriptionId}>Столы с 15 по 24. Стол 16 забронирован на 17:52, стол 17 на 20:20. У столов 15 и 19 гости опаздывают.</desc>
      <g fontSize="15" fontWeight="500" fill="#F6F7F8" textAnchor="middle" dominantBaseline="central">
        <rect x="160" y="10" width="216" height="31" rx="5" fill="#506F7C" />
        <text x="268" y="25">Панорамные окна</text>
        <rect x="443" y="10" width="145" height="31" rx="5" fill="#765C48" />
        <text x="515.5" y="25">Бар</text>
        <rect x="233" y="318" width="132" height="27" rx="5" fill="#326E59" />
        <text x="299" y="331">Стойка хостес</text>
      </g>
      <g fill="#15201A" textAnchor="middle" dominantBaseline="central" fontWeight="600">
        {tables.map((item) => <Table key={item.number} table={item} selected={open && number === item.number}
          pressSequence={tap?.number === item.number ? tap.sequence : undefined} panelId={panelId} onSelect={pressTable} />)}
      </g>
    </svg>
    <div className={styles.panel} id={panelId} role="region" aria-label="Информация о брони" data-open={open} aria-hidden={!open} inert={!open}>
      {table?.booking && <>
        <div className={styles.panelHeader}>
          <span>Брони</span>
          <button type="button" aria-label="Закрыть бронь" className={styles.close} data-button-reveal="off" onClick={closePanel}><UiIcon name="close" size={14} /></button>
        </div>
        <div className={styles.bookingCard}>
          <div className={styles.bookingHeading}>
            <strong>{table.booking.guest}</strong>
            <time dateTime={table.booking.time}>{table.booking.time}</time>
          </div>
          <div className={styles.seating}><span>Зелёный зал</span><span>Стол {table.number}</span></div>
          <div className={styles.guests}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <circle cx="8" cy="6" r="2.6" /><path d="M2 16v-1a6 6 0 0 1 12 0v1ZM13 4a2.5 2.5 0 0 1 0 5m2 2a4 4 0 0 1 3 4" />
            </svg>
            {table.booking.guests}
          </div>
          <span className={styles.guestNote}>{table.booking.note}</span>
        </div>
      </>}
    </div>
  </div>;
}
