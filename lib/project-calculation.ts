import { LAUNCH_CONCEPTS } from "@/lib/launch-concepts";
import {
  calculateProjectEstimate, PROJECT_REGISTER_MAX, PROJECT_REGISTER_MIN, PROJECT_WORKS, PROJECT_CAPABILITIES,
  type ProjectEstimateSelection, type ProjectWorkId, type ProjectCapabilityId,
} from "@/lib/project-estimate";

/** Accept only a bounded selection; names, quantities and prices come from our catalogue. */
export function getProjectCalculation(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const { conceptId, registers, selectedWorkIds, selectedCapabilityIds = [] } = value;
  if (
    typeof conceptId !== "string" || !LAUNCH_CONCEPTS.some((concept) => concept.id === conceptId) ||
    typeof registers !== "number" || !Number.isInteger(registers) || registers < PROJECT_REGISTER_MIN || registers > PROJECT_REGISTER_MAX ||
    !Array.isArray(selectedWorkIds) || selectedWorkIds.length > PROJECT_WORKS.length ||
    !selectedWorkIds.every((id): id is ProjectWorkId => typeof id === "string" && PROJECT_WORKS.some((work) => work.id === id)) ||
    new Set(selectedWorkIds).size !== selectedWorkIds.length ||
    !Array.isArray(selectedCapabilityIds) || selectedCapabilityIds.length > PROJECT_CAPABILITIES.length ||
    !selectedCapabilityIds.every((id): id is ProjectCapabilityId => typeof id === "string" && PROJECT_CAPABILITIES.some((capability) => capability.id === id)) ||
    new Set(selectedCapabilityIds).size !== selectedCapabilityIds.length
  ) return null;

  const selection: ProjectEstimateSelection = {
    conceptId: conceptId as ProjectEstimateSelection["conceptId"],
    registers,
    selectedWorkIds: [...selectedWorkIds],
    selectedCapabilityIds: [...selectedCapabilityIds],
  };
  const estimate = calculateProjectEstimate(selection);
  // Required work is always included, even if omitted in the incoming selection.
  selection.selectedWorkIds = estimate.items.map(({ id }) => id);
  selection.selectedCapabilityIds = estimate.capabilities.map(({ id }) => id);
  return { selection, estimate };
}
