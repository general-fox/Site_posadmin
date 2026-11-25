import { LAUNCH_CONCEPTS } from "@/lib/launch-concepts";
import { calculateProjectEstimate, PROJECT_WORKS, type ProjectEstimateSelection } from "@/lib/project-estimate";
import { getProjectEquipment, PROJECT_CAPABILITIES, type ProjectEquipmentCounts } from "@/lib/project-scope";

function readLegacyIds(input: unknown, catalogue: readonly { id: string }[]) {
  if (!Array.isArray(input) || input.length > catalogue.length) return null;
  const ids = new Set<unknown>(input);
  if (ids.size !== input.length || [...ids].some((id) => !catalogue.some((item) => item.id === id))) return null;
  return ids;
}

/** Normalize legacy estimates against their own catalogue, never the current questionnaire. */
export function getProjectCalculation(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const { conceptId, selectedWorkIds, selectedCapabilityIds = [] } = input as Record<string, unknown>;
  const concept = LAUNCH_CONCEPTS.find(({ id }) => id === conceptId);
  const equipment = getProjectEquipment(input);
  const workIds = readLegacyIds(selectedWorkIds, PROJECT_WORKS);
  const capabilityIds = readLegacyIds(selectedCapabilityIds, PROJECT_CAPABILITIES);
  if (!concept || !equipment || !workIds || !capabilityIds) return null;

  const selection: ProjectEstimateSelection & ProjectEquipmentCounts = {
    conceptId: concept.id,
    ...Object.fromEntries(equipment.map(({ id, quantity }) => [id, quantity])) as ProjectEquipmentCounts,
    selectedWorkIds: PROJECT_WORKS.filter(({ id, required }) => required || workIds.has(id)).map(({ id }) => id),
    selectedCapabilityIds: PROJECT_CAPABILITIES.filter(({ id }) => capabilityIds.has(id)).map(({ id }) => id),
  };
  return { selection, estimate: calculateProjectEstimate(selection) };
}
