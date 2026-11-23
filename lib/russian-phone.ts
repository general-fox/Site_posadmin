const russianCallingCode = "+7";

export const RUSSIAN_PHONE_PREFIX = `${russianCallingCode} `;

export function formatRussianPhone(value: string) {
  const rawDigits = value.replace(/\D/g, "");
  const hasRussianPrefix = value.trimStart().startsWith(russianCallingCode);
  let nationalDigits = rawDigits;
  if (hasRussianPrefix && nationalDigits.startsWith("7")) {
    nationalDigits = nationalDigits.slice(1);
  }
  if (
    nationalDigits.length > 10 &&
    (nationalDigits.startsWith("7") || nationalDigits.startsWith("8"))
  ) {
    nationalDigits = nationalDigits.slice(1);
  }
  nationalDigits = nationalDigits.slice(0, 10);

  let formatted = russianCallingCode;
  if (nationalDigits.length === 0) return RUSSIAN_PHONE_PREFIX;

  formatted += ` (${nationalDigits.slice(0, 3)}`;
  if (nationalDigits.length < 3) return formatted;

  formatted += ")";
  if (nationalDigits.length === 3) return `${formatted} `;

  formatted += ` ${nationalDigits.slice(3, 6)}`;
  if (nationalDigits.length > 6) {
    formatted += `-${nationalDigits.slice(6, 8)}`;
  }
  if (nationalDigits.length > 8) {
    formatted += `-${nationalDigits.slice(8, 10)}`;
  }
  return formatted;
}

export function formatProjectMessengerInput(value: string) {
  const input = value.trim();
  if (!input || input === "+") return input;
  if (!/^\+?[\d .()\u00a0\u202f-]+$/.test(input)) return value;

  const digits = input.replace(/\D/g, "");
  const hasCountryCode = input.startsWith("+");
  if (!digits) return hasCountryCode ? "+" : "";
  if (hasCountryCode && !digits.startsWith("7")) return value;

  // Leave malformed numbers intact so validation can reject them without changing the recipient.
  if (digits.length > 11 || (digits.length === 11 && !/^[78]/.test(digits))) return value;

  // Omit trailing mask characters so deleting can reach the prefix and the empty field.
  return formatRussianPhone(hasCountryCode ? `+${digits}` : digits).trimEnd().replace(/\)$/, "");
}
