export const ONSITE_SUPPORT_LOCATIONS = [
  { id: "moscow", name: "Москва" },
  { id: "moscow-region", name: "Московская область" },
  { id: "saint-petersburg", name: "Санкт-Петербург" },
  { id: "sochi", name: "Сочи" },
  { id: "novorossiysk", name: "Новороссийск" },
  { id: "anapa", name: "Анапа" },
  { id: "gelendzhik", name: "Геленджик" },
  { id: "rostov-on-don", name: "Ростов-на-Дону" },
] as const;

const krasnodar = { id: "krasnodar", name: "Краснодар" } as const;
export const KRASNODAR_ONSITE_LABEL = `${krasnodar.name}, Краснодарский край`;

export const ONSITE_LOCATION_OPTIONS = ONSITE_SUPPORT_LOCATIONS.flatMap<(typeof ONSITE_SUPPORT_LOCATIONS)[number] | typeof krasnodar>((place) =>
  place.id === "novorossiysk" ? [krasnodar, place] : [place],
);

export const ONSITE_GEOGRAPHY = ONSITE_LOCATION_OPTIONS.map((place) =>
  place.id === "krasnodar" ? `${place.name} (по запросу)` : place.name,
);

export type OnsiteSupportLocation =
  | (typeof ONSITE_SUPPORT_LOCATIONS)[number]["id"]
  | "other";

export type OnsiteLocationSelection = {
  location: OnsiteSupportLocation;
  otherCity?: string;
};

export const ONSITE_CITY_MAX_LENGTH = 100;

export const ONSITE_SUPPORT_BY_REQUEST_MESSAGE =
  "Сейчас в вашем городе нет выездного обслуживания. В зависимости от проекта можем организовать выезд — обсудите это с менеджером.";

export function normalizeOnsiteCity(value: unknown): string | null {
  if (typeof value !== "string" || /[\p{Cc}\p{Zl}\p{Zp}\p{Bidi_Control}]/u.test(value)) return null;
  const city = value.trim().replace(/\s+/gu, " ");
  return city && city.length <= ONSITE_CITY_MAX_LENGTH ? city : null;
}

export function isOnsiteSupportAvailable(value: unknown): boolean {
  return ONSITE_SUPPORT_LOCATIONS.some((location) => location.id === value);
}

export function isOnsiteSupportLocation(
  value: unknown,
): value is OnsiteSupportLocation {
  return value === "other" || isOnsiteSupportAvailable(value);
}
