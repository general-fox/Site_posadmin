import { LAUNCH_CONCEPTS, type LaunchConcept } from "@/lib/launch-concepts";

export const PROJECT_REGISTER_MIN = 1;
export const PROJECT_REGISTER_MAX = 10;

export const PROJECT_CAPABILITIES = [
  { id: "egais", title: "ЕГАИС" },
  { id: "marking", title: "Маркировка" },
  { id: "chestny-znak", title: "Честный знак" },
  { id: "mercury", title: "Меркурий" },
  { id: "video-surveillance", title: "Видеонаблюдение" },
  { id: "telephony", title: "IP-телефония" },
  { id: "custom-integration", title: "Индивидуальная интеграция" },
] as const;

export const PROJECT_SCOPE_WORKS = [
  { id: "design", title: "Схема автоматизации", unit: "project", required: true, description: "Разберём процессы и подготовим схему систем и оборудования." },
  { id: "pos", title: "Настройка кассовых мест", unit: "register", required: true, description: "Установка и настройка кассового ПО, меню, ролей и способов оплаты." },
  { id: "kitchen", title: "Кухня и выдача", unit: "project", required: false, description: "Настройка передачи заказов и маршрутов печати или кухонных экранов." },
  { id: "stock", title: "Складской учёт", unit: "project", required: false, description: "Базовая настройка склада, единиц измерения и процессов списания." },
  { id: "fiscal", title: "Подключение ККТ", unit: "register", required: false, description: "Настройка связи кассового ПО с ККТ и проверка фискальных операций." },
  { id: "network", title: "Сеть и рабочие места", unit: "project", required: false, description: "Базовая настройка локальной сети, Wi-Fi и доступа к системам." },
  { id: "integration", title: "Стандартная интеграция", unit: "project", required: false, description: "Одно готовое подключение: доставка, лояльность или гостиничная система." },
  { id: "handover", title: "Пусконаладка и обучение", unit: "project", required: false, description: "Проверка пути заказа, тестовая смена и один сеанс обучения команды." },
] as const;

export type ProjectWorkId = (typeof PROJECT_SCOPE_WORKS)[number]["id"];
export type ProjectCapabilityId = (typeof PROJECT_CAPABILITIES)[number]["id"];
export type ProjectEstimateSelection = {
  conceptId: LaunchConcept["id"];
  registers: number;
  selectedWorkIds: ProjectWorkId[];
  /** Optional for clients opened before additional capabilities were introduced. */
  selectedCapabilityIds?: ProjectCapabilityId[];
};

export function getDefaultProjectSelection(conceptId: LaunchConcept["id"] = "restaurant"): ProjectEstimateSelection {
  if (!LAUNCH_CONCEPTS.some(({ id }) => id === conceptId)) throw new Error("Unknown project concept");
  return {
    conceptId,
    registers: PROJECT_REGISTER_MIN,
    selectedWorkIds: PROJECT_SCOPE_WORKS.filter(({ required }) => required).map(({ id }) => id),
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
  const { conceptId, registers, selectedWorkIds, selectedCapabilityIds = [] } = input as Record<string, unknown>;
  const concept = LAUNCH_CONCEPTS.find(({ id }) => id === conceptId);
  if (!concept || typeof registers !== "number" || !Number.isInteger(registers) || registers < PROJECT_REGISTER_MIN || registers > PROJECT_REGISTER_MAX) return null;

  const workIds = readSelectedIds(selectedWorkIds, PROJECT_SCOPE_WORKS);
  const capabilityIds = readSelectedIds(selectedCapabilityIds, PROJECT_CAPABILITIES);
  if (!workIds || !capabilityIds) return null;

  const works = PROJECT_SCOPE_WORKS.filter(({ id, required }) => required || workIds.has(id));
  const capabilities = PROJECT_CAPABILITIES.filter(({ id }) => capabilityIds.has(id));
  return {
    selection: {
      conceptId: concept.id,
      registers,
      selectedWorkIds: works.map(({ id }) => id),
      selectedCapabilityIds: capabilities.map(({ id }) => id),
    },
    concept,
    works,
    capabilities,
  };
}
