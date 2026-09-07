export const RKEEPER_PRODUCT_ID = "r_keeper" as const;

export type RkeeperAdditionalModuleId =
  | "menu-and-dictionaries"
  | "onsite-hardware-support";

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
      "Персональный менеджер",
      "Выделенный канал в мессенджере Telegram или MAX",
      "Гарантированные сроки реагирования и решения задач",
      "Установка и настройка модулей комплекса r_keeper",
      "Обновление и профилактика модулей r_keeper",
      "Диагностика и устранение сбоев r_keeper",
      "Оперативная помощь на станциях официанта и кассира",
      "Удалённое сопровождение ККТ",
      "Удалённое сопровождение ГИС",
      "Срочные запросы по словарям",
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

export function getRkeeperModulePrice(workplaceCount: number) {
  if (workplaceCount <= 6) return 3_000 + workplaceCount * 1_000;
  return 9_500 + (workplaceCount - 6) * 500;
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
): RkeeperCalculation {
  const modulePrice = getRkeeperModulePrice(workplaceCount);
  const selectedIdSet = new Set(selectedAdditionalModuleIds);
  const additionalModules = RKEEPER_TARIFF.additionalModules
    .filter((module) => selectedIdSet.has(module.id))
    .map((module) => ({
      ...module,
      features: [...module.features],
      monthlyPrice: modulePrice,
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
    monthlyTotal: modulePrice * (1 + additionalModules.length),
  };
}
