const palette = {
  background: "#303030",
  panel: "#474747",
  selected: "#599DF8",
  cancel: "#FF8080",
  add: "#92EB83",
  disabled: "#383838",
  divider: "#777777",
  ink: "#F7F7F7",
};

function Grid({ x, y, width, height, columns, values, selected }: {
  x: number;
  y: number;
  width: number;
  height: number;
  columns: number;
  values: readonly string[];
  selected?: string;
}) {
  const rows = Math.ceil(values.length / columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  return <g>
    <rect x={x} y={y} width={width} height={height} rx="9" fill={palette.panel} stroke={palette.divider} />
    {values.map((value, index) => {
      const cellX = x + (index % columns) * cellWidth;
      const cellY = y + Math.floor(index / columns) * cellHeight;
      const active = value === selected;
      const centerX = cellX + cellWidth / 2;
      const centerY = cellY + cellHeight / 2;
      return <g key={`${value}-${index}`}>
        {active && <rect x={cellX} y={cellY} width={cellWidth} height={cellHeight} fill={palette.selected} />}
        {index % columns !== 0 && <path d={`M${cellX} ${cellY}v${cellHeight}`} stroke={palette.divider} strokeWidth=".7" />}
        {index >= columns && <path d={`M${cellX} ${cellY}h${cellWidth}`} stroke={palette.divider} strokeWidth=".7" />}
        {value === "previous" || value === "next" ? (
          <path d="M-8 0H8M2-6l6 6-6 6" transform={`translate(${centerX} ${centerY}) scale(${value === "previous" ? -1 : 1} 1)`} fill="none" stroke={palette.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <text x={centerX} y={centerY + 6} textAnchor="middle" fill={active ? "#142D4F" : palette.ink} fontSize={active ? 20 : 19} fontWeight={active ? "700" : "600"}>{value}</text>
        )}
      </g>;
    })}
  </g>;
}

function CommentIcon({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y}h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-7l-4 4v-4h-3a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z`} fill="none" stroke={palette.ink} strokeWidth="1.4" strokeLinejoin="round" />;
}

function Navigation() {
  return <g fill="none" stroke={palette.ink} strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    <path d="m20 104 8-7 8 7m-13-2v12h10v-12m-6 12v-7h4v7" />
    <circle cx="27" cy="204" r="6" /><path d="m32 209 5 5" />
    <path d="m19 301 6-3 7 3 6-3v13l-6 3-7-3-6 3v-13Zm6-3v13m7-10v13" />
    <rect x="19" y="400" width="18" height="15" rx="2" /><path d="M23 397v6m10-6v6m-14 3h18" /><circle cx="34" cy="414" r="4" fill={palette.panel} /><path d="M34 412v3h2" />
    <path d="M22 497c-3 2-1 8 4 13s10 7 12 4l-4-5-4 2-5-5 2-4-5-5Z" />
    <g stroke={palette.ink}><path d="M18 599a17 17 0 0 1 20 0m-17 4a12 12 0 0 1 14 0m-11 4a6 6 0 0 1 8 0" /><circle cx="28" cy="612" r="1" fill={palette.ink} stroke="none" /></g>
    <path d="M20 649a8 8 0 0 1 13-5l3 3m0-5v5h-5m5 8a8 8 0 0 1-13 5l-3-3m0 5v-5h5" />
    <path d="m25 697 1-3h4l1 3 3 1 3-1 2 4-2 2v4l2 2-2 4-3-1-3 1-1 3h-4l-1-3-3-1-3 1-2-4 2-2v-4l-2-2 2-4 3 1 3-1Z" /><circle cx="28" cy="705" r="4" />
    <circle cx="25" cy="750" r="4" /><path d="M18 762v-3c0-5 14-5 14 0v3m4-11v10m-5-5h10" />
  </g>;
}

/** A vector presentation of the product UI, with no guest or venue data. */
export function ReZebraReservationScreen() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 780" preserveAspectRatio="none" width="100%" height="100%" role="img" aria-label="Rezebra: создание резерва, выбор времени и числа гостей" style={{ display: "block", fontFamily: "Inter, Arial, sans-serif" }}>
    <title>Создание резерва в Rezebra</title>
    <desc>Векторный пример интерфейса: дата, продолжительность, время, количество гостей и пустые поля контактов и комментариев.</desc>
    <rect width="1200" height="780" fill={palette.background} />
    <rect y="50" width="56" height="730" fill={palette.panel} />
    <path d="M56 50v730M0 50h1200" stroke={palette.divider} />
    <Navigation />

    <g fontSize="17" fontWeight="500">
      <rect width="94" height="50" fill={palette.selected} />
      <path d="m21 18-6 7 6 7" fill="none" stroke={palette.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <text x="35" y="31" fill={palette.ink}>Назад</text>
      <rect x="98" width="180" height="50" fill={palette.selected} />
      <text x="188" y="31" fill={palette.ink} textAnchor="middle">+_ (___) ___-__-__</text>
      <rect x="281" width="43" height="50" fill={palette.add} />
      <path d="M295 25h16m-8-8v16" stroke="#101010" strokeWidth="2" strokeLinecap="round" />
    </g>

    <g fill={palette.ink} fontSize="15" fontWeight="500">
      <text x="74" y="72">Дата</text>
      <rect x="72" y="78" width="360" height="48" rx="6" fill={palette.panel} stroke={palette.divider} />
      <text x="88" y="108" fontSize="20" fontFamily="ui-monospace, monospace">23.11.2026</text>
      <g fill="none" stroke={palette.ink} strokeWidth="1.7"><rect x="408" y="94" width="13" height="13" rx="2" /><path d="M408 98h13m-10-7v5m7-5v5" /></g>
      <rect x="556" y="89" width="39" height="20" rx="10" fill={palette.disabled} stroke={palette.divider} />
      <circle cx="566" cy="99" r="8" fill="#B5B5B5" />
      <text x="603" y="104" fontSize="16">Без лимита</text>
      <text x="80" y="144">Продолжительность резерва</text>
      <Grid x={69} y={150} width={730} height={66} columns={8} values={["previous", "02:15", "02:30", "02:45", "03:00", "03:15", "03:30", "next"]} selected="02:30" />

      <text x="77" y="237">Часы</text>
      <text x="394" y="237">Минуты</text>
      <Grid x={70} y={244} width={301} height={198} columns={3} values={["previous", "12", "13", "14", "15", "16", "17", "18", "next"]} selected="15" />
      <text x="380" y="354" textAnchor="middle" fontSize="24">:</text>
      <Grid x={389} y={244} width={410} height={198} columns={4} values={["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"]} selected="30" />

      <text x="75" y="458">Количество гостей</text>
      <Grid x={72} y={464} width={727} height={68} columns={12} values={["previous", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "next"]} selected="2" />
      <text x="75" y="549">Стол</text>
      <rect x="72" y="556" width="360" height="48" rx="6" fill={palette.panel} stroke={palette.divider} />
      <text x="252" y="585" textAnchor="middle" fontSize="18" fontWeight="500">Отсутствует</text>

      <text x="810" y="82">Номер телефона</text>
      <rect x="808" y="89" width="376" height="68" rx="6" fill={palette.panel} stroke={palette.divider} />
      <path d="m1156 118 10 10m0-10-10 10" fill="none" stroke={palette.ink} strokeWidth="1.7" strokeLinecap="round" />
      <text x="810" y="175">Имя</text>
      <rect x="808" y="182" width="376" height="68" rx="6" fill={palette.panel} stroke={palette.divider} />
      <path d="m1156 211 10 10m0-10-10 10" fill="none" stroke={palette.ink} strokeWidth="1.7" strokeLinecap="round" />
      <text x="808" y="270" fontSize="17">Комментарий к гостю</text>
      <rect x="808" y="277" width="376" height="144" rx="6" fill={palette.panel} stroke={palette.divider} />
      <CommentIcon x={818} y={289} />
      <text x="808" y="448" fontSize="17">Комментарий к резерву</text>
      <rect x="808" y="456" width="376" height="145" rx="6" fill={palette.panel} stroke={palette.divider} />
      <CommentIcon x={818} y={468} />
    </g>

    <g fontSize="17" fontWeight="500" fill={palette.ink} textAnchor="middle">
      <rect x="808" y="617" width="130" height="70" rx="2" fill={palette.cancel} />
      <text x="873" y="658" fill="#301A1A">Не сохранять</text>
      <rect x="808" y="692" width="130" height="70" rx="2" fill={palette.disabled} />
      <text x="873" y="733" fontSize="15" fill="#B5B5B5">Лист ожидания</text>
      <rect x="943" y="617" width="241" height="145" rx="2" fill={palette.disabled} />
      <text x="1063" y="695" fill="#B5B5B5">Сохранить</text>
    </g>
  </svg>;
}
