export const IT_ADMINISTRATION_PRODUCT_ID = "it_administration" as const;
export const IT_ADMINISTRATION_MODULE_ID = "system-administration" as const;

export type ItAdministrationModuleId =
  typeof IT_ADMINISTRATION_MODULE_ID;

export type CalculatedItAdministrationModule = {
  id: ItAdministrationModuleId;
  name: string;
  features: string[];
  monthlyPrice: number;
};

export type ItAdministrationCalculation = {
  product: {
    id: typeof IT_ADMINISTRATION_PRODUCT_ID;
    name: "Системное IT администрирование";
  };
  workplaceCount: number;
  selectedModules: CalculatedItAdministrationModule[];
  monthlyTotal: number;
};

export const IT_ADMINISTRATION_TARIFF = {
  product: {
    id: IT_ADMINISTRATION_PRODUCT_ID,
    name: "Системное IT администрирование" as const,
  },
  module: {
    id: IT_ADMINISTRATION_MODULE_ID,
    name: "Системное IT администрирование",
    features: [
      "Сопровождение сотрудников по IT-вопросам",
      "Администрирование локальной сети, Wi-Fi и интернета",
      "Резервный мобильный роутер при проблемах у провайдера",
      "Администрирование IP-телефонии",
      "Администрирование видеонаблюдения",
      "Системы контроля доступа и учёта рабочего времени",
      "Резервное копирование основных баз данных",
    ],
  },
} as const;

export function getItAdministrationModulePrice(workplaceCount: number) {
  if (workplaceCount <= 3) return 3_000 + workplaceCount * 2_000;
  if (workplaceCount <= 6) return 6_000 + workplaceCount * 1_000;
  return 12_000 + (workplaceCount - 6) * 500;
}

export function isItAdministrationModuleId(
  value: string,
): value is ItAdministrationModuleId {
  return value === IT_ADMINISTRATION_MODULE_ID;
}

export function calculateItAdministrationPricing(
  workplaceCount: number,
  selectedModuleIds: ItAdministrationModuleId[],
): ItAdministrationCalculation {
  const monthlyPrice = getItAdministrationModulePrice(workplaceCount);
  const selected = selectedModuleIds.includes(IT_ADMINISTRATION_MODULE_ID);
  const selectedModules = selected
    ? [
        {
          ...IT_ADMINISTRATION_TARIFF.module,
          features: [...IT_ADMINISTRATION_TARIFF.module.features],
          monthlyPrice,
        },
      ]
    : [];

  return {
    product: IT_ADMINISTRATION_TARIFF.product,
    workplaceCount,
    selectedModules,
    monthlyTotal: selected ? monthlyPrice : 0,
  };
}
