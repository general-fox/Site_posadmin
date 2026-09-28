import {
  isOnsiteSupportAvailable,
  type OnsiteSupportLocation,
} from "@/lib/onsite-support";
import { DEFAULT_PRICING, getSchedulePrice, type PricingConfig } from "@/lib/pricing-config";

export const RKEEPER_PRODUCT_ID = "r_keeper" as const;

export type RkeeperAdditionalModuleId =
  | "menu-and-dictionaries"
  | "onsite-hardware-support";

export type RkeeperModuleId = "remote-technical-support" | RkeeperAdditionalModuleId;

export type RkeeperModule = {
  id: string;
  name: string;
  features: string[];
};

export type CalculatedRkeeperModule = RkeeperModule & {
  monthlyPrice: number;
};

export type RkeeperCalculation = {
  product: {
    id: typeof RKEEPER_PRODUCT_ID;
    name: "r_keeper";
  };
  workplaceCount: number;
  baseModule: CalculatedRkeeperModule;
  additionalModules: CalculatedRkeeperModule[];
  monthlyTotal: number;
};

export const RKEEPER_TARIFF = {
  product: {
    id: RKEEPER_PRODUCT_ID,
    name: "r_keeper" as const,
  },
  baseModule: {
    id: "remote-technical-support",
    name: "Удалённое техническое сопровождение r_keeper",
    features: [
      "Установка и настройка модулей комплекса r_keeper",
      "Обновление и профилактика модулей r_keeper",
      "Диагностика и устранение сбоев r_keeper",
      "Оперативная помощь на станциях официанта и кассира",
      "Удалённое сопровождение ККТ",
      "Удалённое сопровождение ГИС",
      "Срочные запросы по словарям",
      "Персональный менеджер",
      "Выделенный канал в мессенджере Telegram или MAX",
      "Гарантированные сроки реагирования и решения задач",
    ],
  },
  additionalModules: [
    {
      id: "menu-and-dictionaries" as const,
      name: "Сопровождение меню и словарей r_keeper",
      features: [
        "Приём задачи до 10 минут",
        "Меню и модификаторы",
        "Пользователи и карты доступа",
        "Залы, столы, схемы",
        "Скидки и наценки",
        "Акции и бонусные программы",
        "Валюты и сертификаты",
        "Прочие словари системы",
      ],
    },
    {
      id: "onsite-hardware-support" as const,
      name: "Выездное аппаратно-техническое сопровождение",
      features: [
        "Срок реакции на блокирующие ситуации до 3 часов",
        "Срок реакции на сбои периферии до 24 часов",
        "Прочие выезды в приоритетном порядке",
        "Установка и настройка оборудования в рамках договора",
        "Диагностика и модульный ремонт оборудования",
        "Профилактика и кабель-менеджмент",
      ],
    },
  ],
} satisfies {
  product: RkeeperCalculation["product"];
  baseModule: RkeeperModule;
  additionalModules: Array<
    RkeeperModule & { id: RkeeperAdditionalModuleId }
  >;
};

export function getRkeeperModulePrice(
  workplaceCount: number,
  pricing: PricingConfig = DEFAULT_PRICING,
  moduleId: RkeeperModuleId = "remote-technical-support",
) {
  const schedule = moduleId === "menu-and-dictionaries"
    ? pricing.rkeeper.menu
    : moduleId === "onsite-hardware-support"
      ? pricing.rkeeper.onsite
      : pricing.rkeeper.base;
  return getSchedulePrice(workplaceCount, schedule);
}

export function isRkeeperAdditionalModuleId(
  value: string,
): value is RkeeperAdditionalModuleId {
  return RKEEPER_TARIFF.additionalModules.some(
    (module) => module.id === value,
  );
}

export function calculateRkeeperPricing(
  workplaceCount: number,
  selectedAdditionalModuleIds: RkeeperAdditionalModuleId[],
  location?: OnsiteSupportLocation,
  pricing: PricingConfig = DEFAULT_PRICING,
): RkeeperCalculation {
  const modulePrice = getRkeeperModulePrice(workplaceCount, pricing);
  const selectedIdSet = new Set(selectedAdditionalModuleIds);
  const additionalModules = RKEEPER_TARIFF.additionalModules
    .filter(
      (module) =>
        selectedIdSet.has(module.id) &&
        (module.id !== "onsite-hardware-support" ||
          isOnsiteSupportAvailable(location)),
    )
    .map((module) => ({
      ...module,
      features: [...module.features],
      monthlyPrice: getRkeeperModulePrice(workplaceCount, pricing, module.id),
    }));

  return {
    product: RKEEPER_TARIFF.product,
    workplaceCount,
    baseModule: {
      ...RKEEPER_TARIFF.baseModule,
      features: [...RKEEPER_TARIFF.baseModule.features],
      monthlyPrice: modulePrice,
    },
    additionalModules,
    monthlyTotal: additionalModules.reduce((total, module) => total + module.monthlyPrice, modulePrice),
  };
}
