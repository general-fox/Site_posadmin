import { calculateProjectEstimate } from "@/lib/project-estimate";
import { getProjectScope } from "@/lib/project-scope";

/** Accept only a bounded selection; names, quantities and prices come from our catalogue. */
export function getProjectCalculation(input: unknown) {
  const scope = getProjectScope(input);
  if (!scope) return null;
  return { selection: scope.selection, estimate: calculateProjectEstimate(scope.selection) };
}
