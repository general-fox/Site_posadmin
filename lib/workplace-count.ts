export const MIN_ONLINE_WORKPLACES = 1;
export const MAX_ONLINE_WORKPLACES = 20;

export const ONLINE_WORKPLACE_LIMIT_NOTE = `Если рабочих мест больше ${MAX_ONLINE_WORKPLACES}, обсудите индивидуальный расчёт с менеджером.`;

export function isOnlineWorkplaceCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= MIN_ONLINE_WORKPLACES && value <= MAX_ONLINE_WORKPLACES;
}
