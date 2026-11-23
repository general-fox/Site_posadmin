import { LAUNCH_CONCEPTS } from "@/lib/launch-concepts";
import {
  formatCashRegisters, PROJECT_CAPABILITIES, PROJECT_REGISTER_MAX, PROJECT_REGISTER_MIN, PROJECT_SCOPE_WORKS,
  type ProjectEstimateSelection, type ProjectWorkId,
} from "@/lib/project-scope";

export { formatCashRegisters, getDefaultProjectSelection, PROJECT_CAPABILITIES, PROJECT_REGISTER_MAX, PROJECT_REGISTER_MIN } from "@/lib/project-scope";
export type { ProjectCapabilityId, ProjectEstimateSelection, ProjectWorkId } from "@/lib/project-scope";

export const PROJECT_ESTIMATE_NOTICE = "Черновые расценки, уточняются менеджером. Это не окончательная смета.";
export const PROJECT_ESTIMATE_EXCLUSIONS = "Оборудование, лицензии, подписки, выезд и нестандартные интеграции не включены.";
export const PROJECT_CAPABILITIES_NOTICE = "Рассчитаем индивидуально. Стоимость не включена в сумму расчёта.";

/** Draft prices kept for existing estimates and legacy callback requests. */
const projectWorkPrices = {
  design: 12_000,
  pos: 6_000,
  kitchen: 8_000,
  stock: 14_000,
  fiscal: 5_000,
  network: 10_000,
  integration: 12_000,
  handover: 12_000,
} as const satisfies Record<ProjectWorkId, number>;

export type ProjectWork = {
  [Work in (typeof PROJECT_SCOPE_WORKS)[number] as Work["id"]]: Work & { readonly price: (typeof projectWorkPrices)[Work["id"]] };
}[ProjectWorkId];

export const PROJECT_WORKS: readonly ProjectWork[] = PROJECT_SCOPE_WORKS.map((work) => ({
  ...work,
  price: projectWorkPrices[work.id],
}) as ProjectWork);

export function formatProjectMoney(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new RangeError("Invalid project amount");
  return `${amount.toLocaleString("ru-RU")}\u00a0₽`;
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
  return { concept, registers: selection.registers, items, capabilities, total: items.reduce((sum, item) => sum + item.total, 0) };
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
