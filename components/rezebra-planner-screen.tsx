import { useId } from "react";

const palette = {
  background: "#303030",
  panel: "#454545",
  blue: "#599DF8",
  table: "#92EB83",
  reserved: "#FF8080",
  wall: "#354454",
  chair: "#BFC7D0",
  text: "#F7F7F7",
  tableText: "#11150F",
  control: "#656565",
  line: "#757575",
} as const;

const reservations = [
  ["11:00", "3 гостя"], ["11:30", "4 гостя"], ["12:00", "5 гостей"],
  ["12:45", "5 гостей"], ["13:15", "4 гостя"], ["13:45", "3 гостя"],
  ["14:30", "7 гостей"], ["15:00", "6 гостей"], ["15:30", "3 гостя"],
  ["16:00", "7 гостей"], ["16:30", "6 гостей"], ["17:15", "1 гость"],
] as const;

function NavIcon({ x, y, kind, active = false }: { x: number; y: number; kind: "home" | "search" | "map" | "calendar" | "phone" | "wifi" | "refresh" | "settings" | "users"; active?: boolean }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7M6 8v13h12V8M10 21v-7h4v7" /></>,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5ZM9 3v16M15 5v16" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6M17 2v6M3 11h18M15 14v4l3 1" /></>,
    phone: <><path d="m7 3 3 5-3 3c2 4 3 5 7 7l3-3 5 3-2 4C9 22 2 15 2 5l5-2Z" /></>,
    wifi: <><path d="M2 7a17 17 0 0 1 20 0M5 11a12 12 0 0 1 14 0M8 15a6 6 0 0 1 8 0" /><circle cx="12" cy="20" r="1" fill="currentColor" /></>,
    refresh: <><path d="M20 9a8 8 0 0 0-14-4L3 8M3 3v5h5M4 15a8 8 0 0 0 14 4l3-3M21 21v-5h-5" /></>,
    settings: <><path d="m10 2 4 0 1 3 3 1 3 3-2 3 0 3 1 3-4 3-3-1-3 1-4-3 1-3 0-3-2-3 3-3 3-1 1-3Z" /><circle cx="12" cy="12" r="3" /></>,
    users: <><circle cx="9" cy="7" r="4" /><path d="M2 21v-3a7 7 0 0 1 14 0v3M18 12v8M14 16h8" /></>,
  };
  return <g transform={`translate(${x} ${y})`} color={active ? "#FFFFFF" : palette.text} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</g>;
}

function Table({ number, x, y, round = false, reserved = false, status, time }: { number: number; x: number; y: number; round?: boolean; reserved?: boolean; status?: string; time?: string }) {
  const width = round ? 76 : 102;
  const height = round ? 76 : 66;
  const center = width / 2;
  const chairStyle = { fill: palette.chair, stroke: palette.wall, strokeWidth: .8 };
  return <g transform={`translate(${x} ${y})`}>
    <text x="2" y="-14" fontSize="17" fontWeight="500">{number}</text>
    <rect x={center - 8} y="-9" width="16" height="7" rx="3" {...chairStyle} />
    <rect x={center - 8} y={height + 2} width="16" height="7" rx="3" {...chairStyle} />
    <rect x="-9" y={height / 2 - 8} width="7" height="16" rx="3" {...chairStyle} />
    <rect x={width + 2} y={height / 2 - 8} width="7" height="16" rx="3" {...chairStyle} />
    {!round && number % 3 === 2 && <rect x="2" y="-12" width={width - 4} height="8" rx="4" {...chairStyle} />}
    <rect width={width} height={height} rx={round ? 38 : 7} fill={reserved ? palette.reserved : palette.table} stroke={palette.tableText} strokeWidth="1" />
    {status && <text x={center} y={round ? 25 : 23} fontSize={round ? 13 : 14} fontWeight="600" textAnchor="middle" fill={palette.tableText}>{status}</text>}
    {time && <text x={center} y={round ? 46 : 45} fontSize="22" fontWeight="600" textAnchor="middle" fill={palette.tableText}>{time}</text>}
    {reserved && <><rect x="11" y={height - 21} width={width - 22} height="5" rx="2.5" fill={palette.blue} /><g stroke={palette.tableText} strokeWidth="1.2" fill="none"><path d={`m${center - 22} ${height - 8} 4-4 4 4M${center - 8} ${height - 11}v5M${center - 11} ${height - 8}h6`} /><circle cx={center + 12} cy={height - 8} r="3" /><circle cx={center + 24} cy={height - 8} r="3" /></g></>}
    {(reserved || number === 17) && <><circle cx={width + 3} cy="-2" r="5" fill="#FFB23D" /><path d={`m${width} 1 6-6`} stroke="#FFFFFF" strokeWidth="1.2" /></>}
  </g>;
}

function Plant({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><circle r="19" fill="#82B39A" /><path d="M-11 7C-12-4-3-11 11-11 13 3 5 11-6 9M-9 9 6-5" fill="#C5E7C7" stroke="#DDF0D8" strokeWidth="1.1" /><text x="3" y="4" fontSize="6" fontWeight="600" fill="#FFFFFF">Оз...</text></g>;
}

export function ReZebraPlannerScreen() {
  const id = useId();
  return <svg viewBox="0 0 1200 780" preserveAspectRatio="none" width="100%" height="100%" role="img" aria-labelledby={`${id}-title ${id}-description`} xmlns="http://www.w3.org/2000/svg" style={{ display: "block", fontFamily: "Inter, Arial, sans-serif" }}>
    <title id={`${id}-title`}>Планировщик Rezebra в тёмной теме — зал у воды</title>
    <desc id={`${id}-description`}>Чёткая векторная иллюстрация тёмного интерфейса Rezebra: список резервов по времени, схема зала с двенадцатью столами, статусы бронирований и временная шкала. Данные показаны для примера.</desc>
    <rect width="1200" height="780" fill={palette.background} />
    <g fill={palette.text}>
      <rect width="94" height="48" fill={palette.blue} />
      <path d="m22 17-7 7 7 7" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
      <text x="34" y="30" fontSize="17" fill="#FFFFFF" fontWeight="600">Назад</text>
      <rect x="110" width="170" height="48" fill={palette.panel} />
      <text x="125" y="30" fontSize="18" fontWeight="600">Планировщик</text>
      <path d="M0 49h1200" stroke={palette.line} />

      <rect y="50" width="40" height="730" fill={palette.panel} />
      <rect y="250" width="40" height="70" fill={palette.blue} />
      <NavIcon x={8} y={92} kind="home" /><NavIcon x={8} y={190} kind="search" />
      <NavIcon x={8} y={273} kind="map" active /><NavIcon x={8} y={390} kind="calendar" />
      <NavIcon x={8} y={490} kind="phone" /><NavIcon x={8} y={625} kind="wifi" />
      <NavIcon x={8} y={678} kind="refresh" /><NavIcon x={8} y={721} kind="settings" /><NavIcon x={8} y={754} kind="users" />

      <rect x="46" y="55" width="210" height="641" fill={palette.background} stroke={palette.line} />
      {reservations.map(([time, guests], index) => <g key={time} transform={`translate(46 ${55 + index * 53})`}>
        {time === "15:00" && <rect width="210" height="53" fill={palette.panel} />}
        <path d="M0 53h210" stroke={palette.line} />
        <text x="12" y="32" fontSize="26" fontWeight="500" letterSpacing="-.7">{time}</text>
        <text x="196" y="21" fontSize="14" textAnchor="end">1 РЕЗЕРВ</text>
        <text x="196" y="40" fontSize="14" textAnchor="end">{guests.toLocaleUpperCase("ru-RU")}</text>
      </g>)}
      <rect x="258" y="54" width="4" height="642" fill="#555555" />
      <rect x="258" y="56" width="4" height="400" fill="#929292" />

      <rect x="268" y="55" width="932" height="37" fill={palette.background} />
      <text x="280" y="79" fontSize="16" fontWeight="600">Панорамный зал</text>
      <rect x="438" y="54" width="133" height="38" rx="3" fill={palette.blue} />
      <text x="504" y="79" fontSize="16" fontWeight="600" fill="#FFFFFF" textAnchor="middle">Зал у воды</text>
      <text x="589" y="79" fontSize="16" fontWeight="600">Капитанская гостиная</text>
      <path d="M1079 73.5h14M1086 66.5v14" stroke={palette.text} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="1111" y="55" width="89" height="36" fill={palette.control} />
      <g transform="translate(1138 73.5)" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round">
        <circle r="3.3" />
        <path d="M0-8v2M0 6v2M-8 0h2M6 0h2M-6-6l2 2M4 4l2 2M-6 6l2-2M4-4l2-2" />
      </g>
      <path d="M1173 73.5h14" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />

      <rect x="268" y="93" width="932" height="616" fill={palette.panel} />
      <path d="M302 665V165h860v500H832M302 665h350" fill="none" stroke={palette.wall} strokeWidth="10" strokeLinejoin="miter" />
      <rect x="557" y="193" width="208" height="35" rx="5" fill="#85B5C6" />
      <path d="m629 208 4-7 4 7h-8Zm-5 3 4-7 4 7h-8Zm10 0 4-7 4 7h-8Z" fill="none" stroke={palette.tableText} />
      <text x="687" y="216" fontSize="10" fontWeight="600" fill={palette.tableText} textAnchor="middle">Панорамные окна</text>
      <Plant x={503} y={211} /><Plant x={805} y={211} />
      <rect x="841" y="193" width="180" height="36" rx="10" fill="#8D7258" stroke="#A18B73" />
      <path d="m916 205 10 0-5 7v6m-4 0h8" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
      <text x="943" y="216" fontSize="12" fontWeight="600" fill="#FFFFFF">Бар</text>

      <Table number={17} x={354} y={278} status="Опаздывает" time="00:56" />
      <Table number={18} x={570} y={273} round reserved status="С" time="17:17" />
      <Table number={19} x={773} y={278} reserved status="С 17:52" />
      <Table number={20} x={987} y={278} />
      <Table number={21} x={367} y={412} round /><Table number={22} x={557} y={417} />
      <Table number={23} x={773} y={417} /><Table number={24} x={1000} y={412} round />
      <Table number={25} x={354} y={554} /><Table number={26} x={557} y={554} />
      <Table number={27} x={786} y={548} round /><Table number={28} x={987} y={554} />

      <rect x="644" y="624" width="166" height="47" rx="5" fill="#3C90CF" stroke="#FFFFFF" strokeWidth=".7" />
      <path d="m692 643 4-7 4 7h-8Zm-5 9 4-7 4 7h-8Zm11 0 4-7 4 7h-8Z" fill="none" stroke={palette.tableText} strokeWidth="1.4" />
      <text x="749" y="652" fontSize="11" fontWeight="600" fill={palette.tableText} textAnchor="middle">Стойка хостес</text>
      <rect x="678" y="680" width="96" height="22" rx="5" fill="#7A8997" />
      <text x="726" y="695" fontSize="12" fontWeight="600" fill="#FFFFFF" textAnchor="middle">Вход</text>

      <rect x="268" y="709" width="932" height="71" fill={palette.panel} />
      <rect x="280" y="726" width="136" height="38" rx="4" fill={palette.panel} stroke={palette.line} />
      <text x="292" y="750" fontSize="15" letterSpacing=".5">23.11.2026</text>
      <rect x="395" y="738" width="11" height="11" rx="1" fill="none" stroke={palette.text} /><path d="M395 742h11M398 735v5M403 735v5" stroke={palette.text} />
      <rect x="434" y="728" width="646" height="33" rx="4" fill={palette.background} stroke={palette.line} />
      {Array.from({ length: 29 }, (_, index) => <path key={index} d={`M${454 + index * 22} 731v27`} stroke={palette.line} strokeWidth=".7" />)}
      <text x="770" y="723" fontSize="17" textAnchor="middle">15:26</text>
      <rect x="758" y="728" width="24" height="33" rx="3" fill={palette.blue} stroke="#3C7DC8" />
      <path d="m766 737-5 7 5 7M774 737l5 7-5 7" fill="none" stroke="#FFFFFF" />
      <rect x="1104" y="728" width="82" height="33" rx="3" fill={palette.control} />
      <text x="1145" y="750" fontSize="16" fill="#FFFFFF" textAnchor="middle" fontWeight="600">Сейчас</text>

      <text x="58" y="747" fontSize="26">Всего</text>
      <text x="246" y="733" fontSize="14" textAnchor="end">16 РЕЗЕРВОВ</text>
      <text x="246" y="754" fontSize="14" textAnchor="end">76 ГОСТЕЙ</text>
    </g>
  </svg>;
}
