import { useId } from "react";

type AlertKind = "reduction" | "payment" | "deletion";
type LogRow = { label: string; value?: string; highlighted?: boolean };

export const foxControlAlertSamples: Record<AlertKind, {
  title: string;
  role: string;
  initials: string;
  time: string;
  station: string;
  rows: LogRow[];
}> = {
  reduction: {
    title: "Уменьшение суммы заказа",
    role: "Менеджер смены",
    initials: "МС",
    time: "20:18",
    station: "Касса 01",
    rows: [
      { label: "Было", value: "2 740 ₽", highlighted: true },
      { label: "Стало", value: "2 120 ₽", highlighted: true },
      { label: "Уменьшено на", value: "−620 ₽", highlighted: true },
      { label: "Перенос позиции", highlighted: true },
      { label: "Чайник чая" },
    ],
  },
  payment: {
    title: "Изменения после оплаты",
    role: "Кассир смены",
    initials: "КС",
    time: "20:24",
    station: "Касса 02",
    rows: [
      { label: "Рассчитать чек" },
      { label: "Отмена пречека", highlighted: true },
      { label: "Оплата картой", value: "2 450 ₽" },
      { label: "Закрыть чек" },
    ],
  },
  deletion: {
    title: "Удаление позиции из чека",
    role: "Администратор",
    initials: "АД",
    time: "20:31",
    station: "Касса 03",
    rows: [
      { label: "Удалена позиция", highlighted: true },
      { label: "Горячее блюдо", value: "790 ₽" },
      { label: "Итого уменьшено на", value: "−790 ₽", highlighted: true },
      { label: "После печати пречека" },
    ],
  },
};

const colors = {
  sheet: "#FFFFFF",
  outline: "#BAA0C7",
  panel: "#F8F5FB",
  row: "#F0EAF6",
  alternate: "#F6F1F9",
  ink: "#302638",
  muted: "#786D80",
  warning: "#C43D80",
};

/** Drawn product notification with fictional roles, venue and operation data. */
export function FoxControlAlertCard({ kind, className }: { kind: AlertKind; className?: string }) {
  const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const titleId = `fox-alert-${instanceId}-title`;
  const descriptionId = `fox-alert-${instanceId}-description`;
  const avatarId = `fox-alert-${instanceId}-avatar`;
  const alert = foxControlAlertSamples[kind];
  const operationDetails = alert.rows.map(({ label, value }) => [label, value].filter(Boolean).join(" ")).join(". ");
  const hasFiveRows = alert.rows.length === 5;
  const rowHeight = hasFiveRows ? 30 : 37;
  const rowGap = hasFiveRows ? 3 : 4;

  return <svg
    className={className}
    viewBox="16 16 588 488"
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-labelledby={`${titleId} ${descriptionId}`}
    preserveAspectRatio="xMidYMid meet"
    style={{ fontFamily: "var(--font-inter), Inter, Arial, sans-serif" }}
  >
    <title id={titleId}>{`FOX CONTROL: ${alert.title}`}</title>
    <desc id={descriptionId}>{`${alert.role}, ${alert.time}, Ресторан 01, ${alert.station}. ${operationDetails}.`}</desc>
    <defs>
      <linearGradient id={avatarId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#925BAA" />
        <stop offset="1" stopColor="#F6814E" />
      </linearGradient>
    </defs>

    <rect x="18" y="18" width="584" height="484" rx="24" fill={colors.sheet} stroke={colors.outline} strokeWidth="1.6" />

    <g fill={colors.muted} fontSize="22" fontWeight="600">
      <text x="44" y="57">FOX / CONTROL</text>
    </g>
    <circle cx="350" cy="51" r="3" fill={colors.warning} />
    <text x="558" y="57" fill={colors.warning} fontSize="20" textAnchor="end">Опасная операция</text>

    <rect x="42" y="80" width="536" height="82" rx="16" fill={colors.panel} />
    <circle cx="82" cy="121" r="25" fill={`url(#${avatarId})`} />
    <text x="82" y="129" fontSize="24" fontWeight="600" textAnchor="middle" fill={colors.sheet}>{alert.initials}</text>
    <text x="122" y="107" fontSize="19" fontWeight="500" fill={colors.warning}>Операцию выполнил</text>
    <text x="122" y="140" fontSize="28" fontWeight="600" fill={colors.ink}>{alert.role}</text>

    <rect x="42" y="178" width="536" height="222" rx="16" fill={colors.panel} />
    <path d="M63 208l9-9m-8 0h8v8" fill="none" stroke={colors.warning} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <text x="94" y="207" fontSize="28" fontWeight="600" fill={colors.warning}>{alert.title}</text>
    {alert.rows.map((row, index) => {
      const y = 225 + index * (rowHeight + rowGap);
      const baseline = y + rowHeight / 2 + 7.5;
      return <g key={row.label}>
        <rect x="84" y={y} width="480" height={rowHeight} rx="7" fill={index % 2 === 0 ? colors.row : colors.alternate} />
        <text x="96" y={baseline} fill={row.highlighted ? colors.warning : colors.ink} fontSize="24" fontWeight={row.highlighted ? "600" : "400"}>{row.label}</text>
        {row.value && <text x="550" y={baseline} fill={row.highlighted ? colors.warning : colors.ink} fontSize="25" fontWeight="600" textAnchor="end">{row.value}</text>}
      </g>;
    })}

    {[
      ["Ресторан", "Ресторан 01"],
      ["Время", alert.time],
      ["Станция", alert.station],
    ].map(([label, value], index) => {
      const x = 42 + index * (544 / 3);
      return <g key={label}>
        <rect x={x} y="416" width={520 / 3} height="56" rx="13" fill={colors.panel} />
        <text x={x + 12} y="436" fontSize="19" fill={colors.muted}>{label}</text>
        <text x={x + 12} y="464" fontSize="24" fontWeight="500" fill={colors.ink}>{value}</text>
      </g>;
    })}

    <circle cx="45" cy="488" r="2.5" fill={colors.muted} />
    <text x="55" y="493" fontSize="18" fill={colors.muted}>Данные зафиксированы автоматически</text>
  </svg>;
}
