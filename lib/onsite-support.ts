export const ONSITE_SUPPORT_LOCATIONS = [
  { id: "anapa", name: "Анапа" },
  { id: "gelendzhik", name: "Геленджик" },
  { id: "moscow", name: "Москва" },
  { id: "saint-petersburg", name: "Санкт-Петербург" },
  { id: "rostov-on-don", name: "Ростов-на-Дону" },
  { id: "novorossiysk", name: "Новороссийск" },
  { id: "sochi", name: "Сочи" },
  { id: "moscow-region", name: "Московская область" },
] as const;

export type OnsiteSupportLocation =
  | (typeof ONSITE_SUPPORT_LOCATIONS)[number]["id"]
  | "other";

export function isOnsiteSupportAvailable(value: unknown): boolean {
  return ONSITE_SUPPORT_LOCATIONS.some((location) => location.id === value);
}

export function isOnsiteSupportLocation(
  value: unknown,
): value is OnsiteSupportLocation {
  return value === "other" || isOnsiteSupportAvailable(value);
}
