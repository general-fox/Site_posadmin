import { evaluatePricingFormula, getFormulaIssue } from "@/lib/pricing-formula";

export type LegacyPriceSchedule = {
  firstSix: [number, number, number, number, number, number];
  // Full monthly price for seven workplaces; each workplace after that adds extraWorkplace.
  fromSeven: number;
  extraWorkplace: number;
};

export type PriceSchedule = LegacyPriceSchedule | { formula: string };

export type PricingConfig = {
  rkeeper: {
    base: PriceSchedule;
    menu: PriceSchedule;
    onsite: PriceSchedule;
  };
  itAdministration: PriceSchedule;
};

function initialRkeeperSchedule(): LegacyPriceSchedule {
  return {
    firstSix: [4_000, 5_000, 6_000, 7_000, 8_000, 9_000],
    fromSeven: 10_000,
    extraWorkplace: 500,
  };
}

export const DEFAULT_PRICING = {
  rkeeper: {
    base: initialRkeeperSchedule(),
    menu: initialRkeeperSchedule(),
    onsite: initialRkeeperSchedule(),
  },
  itAdministration: {
    firstSix: [5_000, 7_000, 9_000, 10_000, 11_000, 12_000] as LegacyPriceSchedule["firstSix"],
    fromSeven: 12_500,
    extraWorkplace: 500,
  },
} satisfies PricingConfig;

export type PricingConfigValidation =
  | { ok: true; value: PricingConfig }
  | { ok: false; error: string };

function hasExactKeys(value: unknown, keys: string[]): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const ownKeys = Reflect.ownKeys(value);
  return ownKeys.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isAmount(value: unknown, minimum: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum && value <= 1_000_000;
}

function validateSchedule(input: unknown, label: string): { ok: true; value: PriceSchedule } | { ok: false; error: string } {
  if (hasExactKeys(input, ["formula"])) {
    const issue = getFormulaIssue(input.formula);
    if (issue) return { ok: false, error: `${label}: ${issue}` };
    return { ok: true, value: { formula: input.formula as string } };
  }
  if (!hasExactKeys(input, ["firstSix", "fromSeven", "extraWorkplace"])) {
    return { ok: false, error: `${label}: указан неполный или неизвестный набор параметров.` };
  }
  const { firstSix, fromSeven, extraWorkplace } = input;
  if (
    !Array.isArray(firstSix) ||
    firstSix.length !== 6 ||
    Reflect.ownKeys(firstSix).length !== 7 ||
    !Array.from(firstSix).every((amount) => isAmount(amount, 1)) ||
    !isAmount(fromSeven, 1)
  ) {
    return { ok: false, error: `${label}: укажите целые цены от 1 до 1 000 000 ₽ для 1–7 рабочих мест.` };
  }
  if (!isAmount(extraWorkplace, 0)) {
    return { ok: false, error: `${label}: доплата за рабочее место должна быть целым числом от 0 до 1 000 000 ₽.` };
  }
  const prices = [...firstSix, fromSeven] as number[];
  if (prices.some((amount, index) => index > 0 && amount < prices[index - 1])) {
    return { ok: false, error: `${label}: цена не должна уменьшаться при увеличении количества рабочих мест.` };
  }
  return {
    ok: true,
    value: {
      firstSix: [...firstSix] as LegacyPriceSchedule["firstSix"],
      fromSeven,
      extraWorkplace,
    },
  };
}

/** Validate and copy a complete price list at the server trust boundary. */
export function validatePricingConfig(input: unknown): PricingConfigValidation {
  if (!hasExactKeys(input, ["rkeeper", "itAdministration"]) || !hasExactKeys(input.rkeeper, ["base", "menu", "onsite"])) {
    return { ok: false, error: "Укажите полный прайс без неизвестных параметров." };
  }
  const base = validateSchedule(input.rkeeper.base, "Удалённое сопровождение r_keeper");
  if (!base.ok) return base;
  const menu = validateSchedule(input.rkeeper.menu, "Меню и словари r_keeper");
  if (!menu.ok) return menu;
  const onsite = validateSchedule(input.rkeeper.onsite, "Выездное сопровождение");
  if (!onsite.ok) return onsite;
  const itAdministration = validateSchedule(input.itAdministration, "IT-администрирование");
  if (!itAdministration.ok) return itAdministration;
  return {
    ok: true,
    value: {
      rkeeper: { base: base.value, menu: menu.value, onsite: onsite.value },
      itAdministration: itAdministration.value,
    },
  };
}

export function getSchedulePrice(workplaceCount: number, schedule: PriceSchedule): number {
  if (!Number.isSafeInteger(workplaceCount) || workplaceCount < 1 || workplaceCount > 10_000) {
    throw new RangeError("Количество рабочих мест должно быть целым числом от 1 до 10 000.");
  }
  if ("formula" in schedule) return evaluatePricingFormula(schedule.formula, workplaceCount);
  return workplaceCount <= 6
    ? schedule.firstSix[workplaceCount - 1]
    : schedule.fromSeven + (workplaceCount - 7) * schedule.extraWorkplace;
}

/** Keep legacy snapshots readable while letting the editor switch to Excel-style formulas. */
export function scheduleToFormula(schedule: PriceSchedule): string {
  if ("formula" in schedule) return schedule.formula;
  const tailBase = schedule.fromSeven - schedule.extraWorkplace;
  const tail = `IF(N>=7,${tailBase}+(N-6)*${schedule.extraWorkplace},0)`;
  return "=" + schedule.firstSix.reduceRight((inner, amount, index) => `IF(N=${index + 1},${amount},\n${inner})`, tail);
}
