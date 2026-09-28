export const CALLBACK_HOURS_LABEL = "Будни, 10:00–19:00 МСК";

const moscowFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Moscow",
  year: "numeric",
});

export function getMoscowDateTime(now = new Date()) {
  const parts = Object.fromEntries(moscowFormatter.formatToParts(now).map(({ type, value }) => [type, value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00+03:00`);
  if (!Number.isFinite(date.getTime()) || getMoscowDateTime(date).date !== value) return null;
  return date;
}

function isWeekday(date: Date) {
  const day = date.getUTCDay(); // Noon in Moscow is always the same UTC calendar day.
  return day !== 0 && day !== 6;
}

export function getCallbackSlots(date: string, now = new Date()): string[] {
  const parsed = parseDate(date);
  if (!parsed || !isWeekday(parsed) || date < getMoscowDateTime(now).date) return [];
  const slots: string[] = [];
  for (let minutes = 10 * 60; minutes < 19 * 60; minutes += 30) {
    const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    if (new Date(`${date}T${time}:00+03:00`).getTime() > now.getTime()) slots.push(time);
  }
  return slots;
}

export function getCallbackDateError(date: string, now = new Date()): string | null {
  const parsed = parseDate(date);
  if (!parsed) return "Выберите дату звонка.";
  if (date < getMoscowDateTime(now).date) return "Эта дата уже прошла. Выберите другую.";
  if (!isWeekday(parsed)) return "В выходные менеджер не на связи. Выберите будний день.";
  if (getCallbackSlots(date, now).length === 0) return "На сегодня время для звонка закончилось. Выберите другой будний день.";
  return null;
}

export function validateCallbackSchedule(date: string, time: string, now = new Date()): string | null {
  const dateError = getCallbackDateError(date, now);
  if (dateError) return dateError;
  if (!/^\d{2}:\d{2}$/.test(time) || !getCallbackSlots(date, now).includes(time)) {
    return "Выберите доступное время: по будням с 10:00 до 18:30 МСК, с шагом 30 минут.";
  }
  return null;
}

export function getNextCallbackSlot(now = new Date()): { date: string; time: string } {
  const today = getMoscowDateTime(now).date;
  const day = new Date(`${today}T12:00:00+03:00`);
  // A complete week always contains an available weekday.
  for (let offset = 0; offset < 8; offset += 1) {
    const date = getMoscowDateTime(day).date;
    const [time] = getCallbackSlots(date, now);
    if (time) return { date, time };
    day.setUTCDate(day.getUTCDate() + 1);
  }
  throw new Error("Could not find a callback slot.");
}
