import { validatePricingConfig, type PricingConfig } from "./pricing-config";

export type PricingSnapshot = { config: PricingConfig; revision: number; updatedAt: string | null };

export function isPricingSnapshot(value: unknown): value is PricingSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  return Number.isSafeInteger(snapshot.revision) && Number(snapshot.revision) >= 0 &&
    (snapshot.updatedAt === null || typeof snapshot.updatedAt === "string") && validatePricingConfig(snapshot.config).ok;
}
