import { LAUNCH_CONCEPTS, type LaunchConcept } from "@/lib/launch-concepts";
import {
  formatCashRegisters, getProjectEquipment, PROJECT_CAPABILITIES, PROJECT_EQUIPMENT,
  type ProjectCapabilityId, type ProjectEquipmentCounts,
} from "@/lib/project-scope";

export { formatCashRegisters, PROJECT_CAPABILITIES, PROJECT_REGISTER_MAX, PROJECT_REGISTER_MIN } from "@/lib/project-scope";
export type { ProjectCapabilityId } from "@/lib/project-scope";

export const PROJECT_ESTIMATE_NOTICE = "Черновые расценки, уточняются менеджером. Это не окончательная смета.";
export const PROJECT_ESTIMATE_EXCLUSIONS = "Оборудование, лицензии, подписки, выезд и нестандартные интеграции не включены.";
export const PROJECT_CAPABILITIES_NOTICE = "Рассчитаем индивидуально. Стоимость не включена в сумму расчёта.";

/** Legacy priced catalogue, independent of the current price-free questionnaire. */
export const PROJECT_WORKS = [
  { id: "design", title: "Схема автоматизации", unit: "project", required: true, price: 12_000, description: "Разберём процессы и подготовим схему систем и оборудования." },
  { id: "pos", title: "Настройка кассовых мест", unit: "register", required: true, price: 6_000, description: "Установка и настройка кассового ПО, меню, ролей и способов оплаты." },
  { id: "kitchen", title: "Кухня и выдача", unit: "project", required: false, price: 8_000, description: "Настройка передачи заказов и маршрутов печати или кухонных экранов." },
  { id: "stock", title: "Складской учёт", unit: "project", required: false, price: 14_000, description: "Базовая настройка склада, единиц измерения и процессов списания." },
  { id: "fiscal", title: "Подключение ККТ", unit: "register", required: false, price: 5_000, description: "Настройка связи кассового ПО с ККТ и проверка фискальных операций." },
  { id: "network", title: "Сеть и рабочие места", unit: "project", required: false, price: 10_000, description: "Базовая настройка локальной сети, Wi-Fi и доступа к системам." },
  { id: "integration", title: "Стандартная интеграция", unit: "project", required: false, price: 12_000, description: "Одно готовое подключение: доставка, лояльность или гостиничная система." },
  { id: "handover", title: "Пусконаладка и обучение", unit: "project", required: false, price: 12_000, description: "Проверка пути заказа, тестовая смена и один сеанс обучения команды." },
] as const;

export type ProjectWork = (typeof PROJECT_WORKS)[number];
export type ProjectWorkId = ProjectWork["id"];
export type ProjectEstimateSelection = Pick<ProjectEquipmentCounts, "registers"> & Partial<Omit<ProjectEquipmentCounts, "registers">> & {
  conceptId: LaunchConcept["id"];
  selectedWorkIds: ProjectWorkId[];
  selectedCapabilityIds?: ProjectCapabilityId[];
};

/** Retain the original defaults for old estimates; the current questionnaire starts empty. */
export function getDefaultProjectSelection(conceptId: LaunchConcept["id"] = "restaurant"): ProjectEstimateSelection & ProjectEquipmentCounts {
  if (!LAUNCH_CONCEPTS.some(({ id }) => id === conceptId)) throw new Error("Unknown project concept");
  return {
    conceptId,
    ...Object.fromEntries(PROJECT_EQUIPMENT.map(({ id, defaultValue }) => [id, defaultValue])) as ProjectEquipmentCounts,
    selectedWorkIds: PROJECT_WORKS.filter(({ required }) => required).map(({ id }) => id),
    selectedCapabilityIds: [],
  };
}

export function formatProjectMoney(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError("Invalid project amount");
  return `${amount.toLocaleString("ru-RU")}\u00a0₽`;
}

export function calculateProjectEstimate(selection: ProjectEstimateSelection) {
  const concept = LAUNCH_CONCEPTS.find(({ id }) => id === selection.conceptId);
  if (!concept) throw new Error("Unknown project concept");
  const equipment = getProjectEquipment(selection);
  if (!equipment) throw new RangeError("Invalid project equipment count");
  if (!Array.isArray(selection.selectedWorkIds) || selection.selectedWorkIds.some((id) => !PROJECT_WORKS.some((work) => work.id === id))) {
    throw new Error("Unknown project work");
  }
  const selectedCapabilityIds = selection.selectedCapabilityIds === undefined ? [] : selection.selectedCapabilityIds;
  if (
    !Array.isArray(selectedCapabilityIds) || selectedCapabilityIds.length > PROJECT_CAPABILITIES.length ||
    selectedCapabilityIds.some((id) => !PROJECT_CAPABILITIES.some((capability) => capability.id === id)) ||
    new Set(selectedCapabilityIds).size !== selectedCapabilityIds.length
  ) throw new Error("Unknown project capability");
  const capabilities = PROJECT_CAPABILITIES.filter(({ id }) => selectedCapabilityIds.includes(id));
  const selected = new Set(selection.selectedWorkIds);
  const items = PROJECT_WORKS.filter((work) => work.required || selected.has(work.id)).map((work) => {
    const quantity = work.unit === "register" ? selection.registers : 1;
    return { ...work, quantity, total: work.price * quantity };
  });
  return { concept, registers: selection.registers, equipment, items, capabilities, total: items.reduce((sum, item) => sum + item.total, 0) };
}

export type ProjectEstimate = ReturnType<typeof calculateProjectEstimate>;

export function buildProjectEstimateBrief(estimate: ProjectEstimate) {
  return [
    `Проект / запуск с нуля. Формат: ${estimate.concept.label}. ${formatCashRegisters(estimate.registers)}.`,
    "Выбранные работы (черновые расценки):",
    ...estimate.items.map((item) => `• ${item.title}: ${item.quantity} × ${formatProjectMoney(item.price)} = ${formatProjectMoney(item.total)}.`),
    `Предварительный ориентир: ${formatProjectMoney(estimate.total)}.`,
    ...(estimate.capabilities.length ? [
      `Дополнительные возможности: ${estimate.capabilities.map(({ title }) => title).join(", ")}.`,
      PROJECT_CAPABILITIES_NOTICE,
    ] : []),
    PROJECT_ESTIMATE_NOTICE,
    PROJECT_ESTIMATE_EXCLUSIONS,
    "Прошу уточнить состав и прислать согласованную смету удобным способом связи.",
  ].join("\n");
}
