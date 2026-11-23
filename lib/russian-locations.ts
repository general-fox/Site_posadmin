import catalog from "./russian-locations-data.json";
import { ONSITE_LOCATION_OPTIONS, ONSITE_SUPPORT_LOCATIONS, type OnsiteSupportLocation } from "./onsite-support";

export type RussianLocation = {
  id: string;
  name: string;
  region?: string;
  onsiteLocation?: OnsiteSupportLocation;
};

export function formatRussianLocation(location: RussianLocation): string {
  return location.region ? `${location.name}, ${location.region}` : location.name;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replaceAll("ё", "е").replace(/[-–—,\s]+/gu, " ");
}

const supported = new Map<string, OnsiteSupportLocation>(
  ONSITE_SUPPORT_LOCATIONS.map(({ id, name }) => [normalize(name), id]),
);
const displayOrder = new Map(ONSITE_LOCATION_OPTIONS.map(({ name }, index) => [normalize(name), index]));

const locations = Object.entries(catalog).flatMap(([region, cities]) => [
  { id: region, name: region, onsiteLocation: supported.get(normalize(region)) },
  ...cities.filter((name) => name !== region).map((name) => ({
    id: `${region}/${name}`,
    name,
    region,
    onsiteLocation: supported.get(normalize(name)),
  })),
] satisfies RussianLocation[]).map((place: RussianLocation) => ({
  place,
  name: normalize(place.name),
  label: normalize(formatRussianLocation(place)),
  reversed: place.region ? normalize(`${place.region} ${place.name}`) : "",
}));

const confirmedLabels = new Set(locations.map(({ place }) => formatRussianLocation(place)));
const collator = new Intl.Collator("ru");

export function findRussianLocationLabel(label: string): boolean {
  return confirmedLabels.has(label);
}

export function searchRussianLocations(value: string): RussianLocation[] {
  const query = normalize(value);
  if (query.length < 2) return [];

  return locations.flatMap(({ place, name, label, reversed }) => {
    if (label === query || reversed === query) return [{ place, priority: 0 }];
    if (name === query) return [{ place, priority: 1 }];
    if (name.startsWith(query)) return [{ place, priority: 2 }];
    if (label.includes(query) || reversed.includes(query)) return [{ place, priority: 3 }];
    return [];
  }).sort((a, b) => a.priority - b.priority
    || (displayOrder.get(normalize(a.place.name)) ?? displayOrder.size) - (displayOrder.get(normalize(b.place.name)) ?? displayOrder.size)
    || collator.compare(a.place.name, b.place.name)
    || collator.compare(a.place.region ?? "", b.place.region ?? ""))
    .slice(0, 8).map(({ place }) => place);
}
