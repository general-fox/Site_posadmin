import { LAUNCH_CONCEPTS, type LaunchConcept } from "@/lib/launch-concepts";

export const PROJECT_REGISTER_MIN = 0;
export const PROJECT_REGISTER_MAX = 20;

export const PROJECT_EQUIPMENT = [
  { id: "registers", label: "Кассовые станции", hint: "Рабочие места кассиров", min: PROJECT_REGISTER_MIN, max: PROJECT_REGISTER_MAX, defaultValue: 1 },
  { id: "waiterStations", label: "Станции официантов", hint: "Рабочие места для приёма заказов", min: 0, max: 20, defaultValue: 0 },
  { id: "receiptPrinters", label: "Чековые принтеры", hint: "Для бара и кухни — общее количество", min: 0, max: 20, defaultValue: 0 },
  { id: "labelPrinters", label: "Принтеры этикеток", hint: "Для доставки", min: 0, max: 10, defaultValue: 1 },
  { id: "kitchenScreens", label: "Экраны повара", hint: "Для отображения заказов на кухне", min: 0, max: 20, defaultValue: 0 },
] as const;

export type ProjectEquipmentId = (typeof PROJECT_EQUIPMENT)[number]["id"];
export type ProjectEquipmentCounts = Record<ProjectEquipmentId, number>;

/** Old clients omit the newly separated equipment; missing fields mean no units. */
export function getProjectEquipment(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const values = input as Record<string, unknown>;
  const equipment: Array<(typeof PROJECT_EQUIPMENT)[number] & { quantity: number }> = [];
  for (const item of PROJECT_EQUIPMENT) {
    const quantity = values[item.id] === undefined && item.id !== "registers" ? 0 : values[item.id];
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < item.min || quantity > item.max) return null;
    equipment.push({ ...item, quantity });
  }
  return equipment;
}

export const PROJECT_CAPABILITIES = [
  { id: "egais", title: "ЕГАИС" },
  { id: "marking", title: "Маркировка" },
  { id: "chestny-znak", title: "Честный знак" },
  { id: "mercury", title: "Меркурий" },
  { id: "video-surveillance", title: "Видеонаблюдение" },
  { id: "telephony", title: "IP-телефония" },
  { id: "guest-wifi", title: "Гостевой Wi-Fi" },
] as const;

export const PROJECT_SCOPE_WORKS = [
  { id: "rkeeper", title: "r_keeper", unit: "project", required: false, description: "Поставка ПО, установка и начальная настройка под требования вашего заведения." },
  { id: "equipment", title: "Оборудование", unit: "project", required: false, description: "Доставка, установка и настройка оборудования на месте." },
  { id: "dictionaries", title: "Первоначальное заполнение словарей", unit: "project", required: false, description: "Заполним меню, сотрудников, валюты, скидки и другие справочники для начала работы." },
  { id: "training", title: "Обучение сотрудников", unit: "project", required: false, description: "Обучим сотрудников работе с системой и разберём основные сценарии вашей смены." },
  { id: "network", title: "Локальная сеть", unit: "project", required: false, description: "Подбор и настройка сетевого оборудования, монтаж локальной сети и Wi-Fi." },
  { id: "fiscal", title: "ККТ", unit: "project", required: false, description: "Регистрация ККТ в ФНС, подключение к ОФД и настройка связи с кассовой системой. Проверим формирование и отправку чеков." },
] as const;

export type ProjectWorkId = (typeof PROJECT_SCOPE_WORKS)[number]["id"];
export type ProjectCapabilityId = (typeof PROJECT_CAPABILITIES)[number]["id"];
export type ProjectEstimateSelection = {
  conceptId: LaunchConcept["id"];
  registers: number;
  /** Optional to accept questionnaires opened before separate equipment counts. */
  waiterStations?: number;
  receiptPrinters?: number;
  labelPrinters?: number;
  kitchenScreens?: number;
  selectedWorkIds: ProjectWorkId[];
  /** Optional for clients opened before additional capabilities were introduced. */
  selectedCapabilityIds?: ProjectCapabilityId[];
};

export function getDefaultProjectSelection(conceptId: LaunchConcept["id"] = "restaurant"): ProjectEstimateSelection & ProjectEquipmentCounts {
  if (!LAUNCH_CONCEPTS.some(({ id }) => id === conceptId)) throw new Error("Unknown project concept");
  return {
    conceptId,
    ...Object.fromEntries(PROJECT_EQUIPMENT.map(({ id, defaultValue }) => [id, defaultValue])) as ProjectEquipmentCounts,
    selectedWorkIds: [],
    selectedCapabilityIds: [],
  };
}

export function formatCashRegisters(count: number) {
  const suffix = count === 1 ? "кассовое место" : count >= 2 && count <= 4 ? "кассовых места" : "кассовых мест";
  return `${count} ${suffix}`;
}

function readSelectedIds(input: unknown, catalogue: readonly { id: string }[]) {
  if (!Array.isArray(input) || input.length > catalogue.length) return null;
  const ids = new Set<unknown>(input);
  if (ids.size !== input.length || [...ids].some((id) => !catalogue.some((item) => item.id === id))) return null;
  return ids;
}

/** Validate client selections and resolve their scope from the price-free catalogue. */
export function getProjectScope(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const { conceptId, selectedWorkIds, selectedCapabilityIds = [] } = input as Record<string, unknown>;
  const concept = LAUNCH_CONCEPTS.find(({ id }) => id === conceptId);
  const equipment = getProjectEquipment(input);
  if (!concept || !equipment) return null;

  const workIds = readSelectedIds(selectedWorkIds, PROJECT_SCOPE_WORKS);
  const capabilityIds = readSelectedIds(selectedCapabilityIds, PROJECT_CAPABILITIES);
  if (!workIds || !capabilityIds) return null;

  const works = PROJECT_SCOPE_WORKS.filter(({ id }) => workIds.has(id));
  const capabilities = PROJECT_CAPABILITIES.filter(({ id }) => capabilityIds.has(id));
  return {
    selection: {
      conceptId: concept.id,
      ...Object.fromEntries(equipment.map(({ id, quantity }) => [id, quantity])) as ProjectEquipmentCounts,
      selectedWorkIds: works.map(({ id }) => id),
      selectedCapabilityIds: capabilities.map(({ id }) => id),
    },
    concept,
    equipment,
    works,
    capabilities,
  };
}
