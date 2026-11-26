/** Web Animations takes milliseconds. Optimized stylesheets may use seconds. */
export function cssTimeToMs(value: string, fallback = 0): number {
  const time = value.trim().toLowerCase();
  const amount = Number.parseFloat(time);
  if (!Number.isFinite(amount)) return fallback;
  if (time.endsWith("ms")) return amount;
  if (time.endsWith("s")) return amount * 1000;
  return amount === 0 ? 0 : fallback;
}
