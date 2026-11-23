import {
  calculateRkeeperPricing,
  isRkeeperAdditionalModuleId,
  type RkeeperAdditionalModuleId,
} from "@/lib/rkeeper-pricing";
import {
  calculateItAdministrationPricing,
  isItAdministrationModuleId,
  IT_ADMINISTRATION_MODULE_ID,
  type ItAdministrationModuleId,
} from "@/lib/it-administration-pricing";
import {
  isOnsiteSupportAvailable,
  isOnsiteSupportLocation,
  normalizeOnsiteCity,
  ONSITE_SUPPORT_LOCATIONS,
  type OnsiteSupportLocation,
} from "@/lib/onsite-support";
import { DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing-config";

export type CalculationSelection =
  | {
      product: "r_keeper";
      workplaceCount: number;
      selectedAdditionalModules: RkeeperAdditionalModuleId[];
      includeItSupport?: boolean;
      location?: OnsiteSupportLocation;
      otherCity?: string;
    }
  | {
      product: "it_administration";
      workplaceCount: number;
      selectedModules: ItAdministrationModuleId[];
    };

export type CalculationSummary = {
  selection: CalculationSelection;
  productName: string;
  workplaceCount: number;
  locationLabel?: string;
  onsiteByRequest?: true;
  modules: { name: string; monthlyPrice: number }[];
  monthlyTotal: number;
};

/** Only selections cross the trust boundary; prices always come from our tariff. */
export function getCalculationSummary(input: unknown, pricing: PricingConfig = DEFAULT_PRICING): CalculationSummary | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;
  const count = value.workplaceCount;
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 10_000) return null;
  if (value.otherCity !== undefined && (value.product !== "r_keeper" || value.location !== "other")) return null;
  const includeItSupport = value.includeItSupport;
  if (includeItSupport !== undefined && (value.product !== "r_keeper" || typeof includeItSupport !== "boolean")) {
    return null;
  }

  if (value.product === "r_keeper") {
    const modules = value.selectedAdditionalModules;
    if (
      !Array.isArray(modules) ||
      modules.length > 2 ||
      !modules.every((id): id is RkeeperAdditionalModuleId => typeof id === "string" && isRkeeperAdditionalModuleId(id)) ||
      new Set(modules).size !== modules.length ||
      (value.location !== undefined && !isOnsiteSupportLocation(value.location)) ||
      (modules.includes("onsite-hardware-support") && !isOnsiteSupportAvailable(value.location))
    ) return null;

    const location = value.location as OnsiteSupportLocation | undefined;
    const otherCity = normalizeOnsiteCity(value.otherCity);
    if (value.otherCity !== undefined && !otherCity) return null;
    const locationLabel = location === "other" ? otherCity ?? "Другой город" : ONSITE_SUPPORT_LOCATIONS.find((item) => item.id === location)?.name;
    const selection: CalculationSelection = {
      product: "r_keeper",
      workplaceCount: count,
      selectedAdditionalModules: [...modules],
      ...(includeItSupport !== undefined ? { includeItSupport } : {}),
      ...(location ? { location } : {}),
      ...(otherCity ? { otherCity } : {}),
    };
    const calculation = calculateRkeeperPricing(count, modules, location, pricing);
    const itAdministration = includeItSupport
      ? calculateItAdministrationPricing(count, [IT_ADMINISTRATION_MODULE_ID], pricing)
      : undefined;
    return {
      selection,
      productName: "Сопровождение r_keeper",
      workplaceCount: count,
      ...(locationLabel ? { locationLabel } : {}),
      ...(otherCity ? { onsiteByRequest: true } : {}),
      modules: [
        calculation.baseModule,
        ...calculation.additionalModules,
        ...(itAdministration?.selectedModules ?? []),
      ].map(({ name, monthlyPrice }) => ({ name, monthlyPrice })),
      monthlyTotal: calculation.monthlyTotal + (itAdministration?.monthlyTotal ?? 0),
    };
  }

  if (value.product === "it_administration") {
    const modules = value.selectedModules;
    if (
      !Array.isArray(modules) ||
      modules.length !== 1 ||
      !modules.every((id): id is ItAdministrationModuleId => typeof id === "string" && isItAdministrationModuleId(id))
    ) return null;
    const selection: CalculationSelection = {
      product: "it_administration",
      workplaceCount: count,
      selectedModules: [...modules],
    };
    const calculation = calculateItAdministrationPricing(count, modules, pricing);
    return {
      selection,
      productName: "IT-администрирование",
      workplaceCount: count,
      modules: calculation.selectedModules.map(({ name, monthlyPrice }) => ({ name, monthlyPrice })),
      monthlyTotal: calculation.monthlyTotal,
    };
  }
  return null;
}
