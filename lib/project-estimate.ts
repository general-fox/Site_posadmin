import { LAUNCH_CONCEPTS, type LaunchConcept } from "@/lib/launch-concepts";

export const PROJECT_REGISTER_MIN = 1;
export const PROJECT_REGISTER_MAX = 10;
export const PROJECT_ESTIMATE_NOTICE = "Черновые расценки, уточняются менеджером. Это не окончательная смета.";
export const PROJECT_ESTIMATE_EXCLUSIONS = "Оборудование, лицензии, подписки, выезд и нестандартные интеграции не включены.";

/** Draft project-work prices, deliberately separate from approved support tariffs. */
export const PROJECT_WORKS = [
  { id: "design", title: "Схема автоматизации", price: 12_000, unit: "project", required: true, description: "Разберём процессы и подготовим схему систем и оборудования." },
  { id: "pos", title: "Настройка кассовых мест", price: 6_000, unit: "register", required: true, description: "Установка и настройка кассового ПО, меню, ролей и способов оплаты." },
  { id: "kitchen", title: "Кухня и выдача", price: 8_000, unit: "project", required: false, description: "Настройка передачи заказов и маршрутов печати или кухонных экранов." },
  { id: "stock", title: "Складской учёт", price: 14_000, unit: "project", required: false, description: "Базовая настройка склада, единиц измерения и процессов списания." },
  { id: "fiscal", title: "Подключение ККТ", price: 5_000, unit: "register", required: false, description: "Настройка связи кассового ПО с ККТ и проверка фискальных операций." },
  { id: "network", title: "Сеть и рабочие места", price: 10_000, unit: "project", required: false, description: "Базовая настройка локальной сети, Wi-Fi и доступа к системам." },
  { id: "integration", title: "Стандартная интеграция", price: 12_000, unit: "project", required: false, description: "Одно готовое подключение: доставка, лояльность или гостиничная система." },
  { id: "handover", title: "Пусконаладка и обучение", price: 12_000, unit: "project", required: false, description: "Проверка пути заказа, тестовая смена и один сеанс обучения команды." },
] as const;

export type ProjectWorkId = (typeof PROJECT_WORKS)[number]["id"];
export type ProjectWork = (typeof PROJECT_WORKS)[number];
export type ProjectEstimateSelection = {
  conceptId: LaunchConcept["id"];
  registers: number;
  selectedWorkIds: ProjectWorkId[];
};

const recommendedExtras: Record<LaunchConcept["id"], ProjectWorkId[]> = {
  restaurant: ["kitchen", "stock", "fiscal", "network", "handover"],
  cafe: ["stock", "fiscal", "handover"],
  bar: ["stock", "fiscal", "network", "handover"],
  "quick-service": ["kitchen", "stock", "fiscal", "network", "handover"],
  delivery: ["kitchen", "stock", "fiscal", "integration", "handover"],
  hotel: ["kitchen", "stock", "fiscal", "network", "integration", "handover"],
};

export function getDefaultProjectSelection(conceptId: LaunchConcept["id"] = "restaurant"): ProjectEstimateSelection {
  if (!Object.hasOwn(recommendedExtras, conceptId)) throw new Error("Unknown project concept");
  return { conceptId, registers: 1, selectedWorkIds: ["design", "pos", ...recommendedExtras[conceptId]] };
}

export function formatProjectMoney(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError("Invalid project amount");
  return `${amount.toLocaleString("ru-RU")}\u00a0₽`;
}

export function formatCashRegisters(count: number) {
  const suffix = count === 1 ? "кассовое место" : count >= 2 && count <= 4 ? "кассовых места" : "кассовых мест";
  return `${count} ${suffix}`;
}

export function calculateProjectEstimate(selection: ProjectEstimateSelection) {
  const concept = LAUNCH_CONCEPTS.find(({ id }) => id === selection.conceptId);
  if (!concept) throw new Error("Unknown project concept");
  if (!Number.isInteger(selection.registers) || selection.registers < PROJECT_REGISTER_MIN || selection.registers > PROJECT_REGISTER_MAX) {
    throw new RangeError("Project register count must be from 1 to 10");
  }
  if (!Array.isArray(selection.selectedWorkIds) || selection.selectedWorkIds.some((id) => !PROJECT_WORKS.some((work) => work.id === id))) {
    throw new Error("Unknown project work");
  }
  const selected = new Set(selection.selectedWorkIds);
  const items = PROJECT_WORKS.filter((work) => work.required || selected.has(work.id)).map((work) => {
    const quantity = work.unit === "register" ? selection.registers : 1;
    return { ...work, quantity, total: work.price * quantity };
  });
  return { concept, registers: selection.registers, items, total: items.reduce((sum, item) => sum + item.total, 0) };
}

export type ProjectEstimate = ReturnType<typeof calculateProjectEstimate>;

export function buildProjectEstimateBrief(estimate: ProjectEstimate) {
  return [
    `Проект / запуск с нуля. Формат: ${estimate.concept.label}. ${formatCashRegisters(estimate.registers)}.`,
    "Выбранные работы (черновые расценки):",
    ...estimate.items.map((item) => `• ${item.title}: ${item.quantity} × ${formatProjectMoney(item.price)} = ${formatProjectMoney(item.total)}.`),
    `Предварительный ориентир: ${formatProjectMoney(estimate.total)}.`,
    PROJECT_ESTIMATE_NOTICE,
    PROJECT_ESTIMATE_EXCLUSIONS,
    "Прошу уточнить состав и прислать согласованную смету удобным способом связи.",
  ].join("\n");
}
