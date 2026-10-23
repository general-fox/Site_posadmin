export type CallbackSpecialist = "manager" | "technical";

export const CALLBACK_SPECIALIST_LABELS: Record<CallbackSpecialist, string> = {
  manager: "Менеджер",
  technical: "Технический специалист",
};

/** Older callback forms did not send a specialist and still reach a manager. */
export function parseCallbackSpecialist(value: unknown): CallbackSpecialist | null {
  if (value === undefined) return "manager";
  return value === "manager" || value === "technical" ? value : null;
}
