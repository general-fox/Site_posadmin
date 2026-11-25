import { NextResponse } from "next/server";
import { calculateItAdministrationPricing, IT_ADMINISTRATION_MODULE_ID } from "@/lib/it-administration-pricing";
import {
  calculateRkeeperPricing,
  isRkeeperAdditionalModuleId,
  RKEEPER_PRODUCT_ID,
  type RkeeperAdditionalModuleId,
} from "@/lib/rkeeper-pricing";
import {
  CalculationPdfInputError,
  createCalculationNumber,
  createCalculationPdfErrorResponse,
  createCalculationPdfResponse,
  isCalculationPdfRateLimited,
} from "@/lib/calculation-pdf-api";
import { createRkeeperPdf } from "@/lib/rkeeper-pdf";
import { getPricingSnapshot } from "@/lib/pricing-store";
import { isOnlineWorkplaceCount, MAX_ONLINE_WORKPLACES } from "@/lib/workplace-count";
import {
  isOnsiteSupportAvailable,
  isOnsiteSupportLocation,
  normalizeOnsiteCity,
  ONSITE_SUPPORT_BY_REQUEST_MESSAGE,
} from "@/lib/onsite-support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RkeeperPdfRequest = {
  pricingRevision?: unknown;
  product?: unknown;
  workplaceCount?: unknown;
  selectedAdditionalModules?: unknown;
  includeItSupport?: unknown;
  location?: unknown;
  otherCity?: unknown;
};

function parseRequest(body: RkeeperPdfRequest) {
  if (body.product !== RKEEPER_PRODUCT_ID) {
    throw new CalculationPdfInputError("Некорректный программный продукт");
  }
  if (!isOnlineWorkplaceCount(body.workplaceCount)) {
    throw new CalculationPdfInputError(
      `Укажите целое количество рабочих мест от 1 до ${MAX_ONLINE_WORKPLACES}.`,
    );
  }
  if (!Array.isArray(body.selectedAdditionalModules)) {
    throw new CalculationPdfInputError(
      "Некорректный список дополнительных модулей",
    );
  }

  const selectedModules = body.selectedAdditionalModules;
  if (
    selectedModules.some(
      (moduleId) =>
        typeof moduleId !== "string" ||
        !isRkeeperAdditionalModuleId(moduleId),
    )
  ) {
    throw new CalculationPdfInputError("Дополнительный модуль не найден");
  }
  if (new Set(selectedModules).size !== selectedModules.length) {
    throw new CalculationPdfInputError(
      "Дополнительный модуль указан повторно",
    );
  }

  const includeItSupport = body.includeItSupport;
  if (includeItSupport !== undefined && typeof includeItSupport !== "boolean") {
    throw new CalculationPdfInputError("Некорректный выбор IT-сопровождения");
  }

  const location = body.location;
  if (location !== undefined && !isOnsiteSupportLocation(location)) {
    throw new CalculationPdfInputError("Некорректный город или регион");
  }
  if (body.otherCity !== undefined) {
    const otherCity = normalizeOnsiteCity(body.otherCity);
    if (location !== "other" || !otherCity) {
      throw new CalculationPdfInputError("Некорректный город или регион");
    }
  }
  if (
    selectedModules.includes("onsite-hardware-support") &&
    !isOnsiteSupportAvailable(location)
  ) {
    throw new CalculationPdfInputError(
      ONSITE_SUPPORT_BY_REQUEST_MESSAGE,
    );
  }

  return {
    workplaceCount: body.workplaceCount,
    selectedModules: selectedModules as RkeeperAdditionalModuleId[],
    includeItSupport,
    location,
  };
}

export async function POST(request: Request) {
  if (isCalculationPdfRateLimited(request, "rkeeper")) {
    return NextResponse.json(
      { message: "Слишком много запросов. Попробуйте немного позже." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as RkeeperPdfRequest;
    const { workplaceCount, selectedModules, includeItSupport, location } = parseRequest(body);
    const snapshot = getPricingSnapshot();
    if ((body.pricingRevision ?? 0) !== snapshot.revision) {
      return NextResponse.json({ message: "Цены обновились. Проверьте новый расчёт.", snapshot }, { status: 409 });
    }
    const calculation = calculateRkeeperPricing(
      workplaceCount,
      selectedModules,
      location,
      snapshot.config,
    );
    const itAdministration = includeItSupport
      ? calculateItAdministrationPricing(workplaceCount, [IT_ADMINISTRATION_MODULE_ID], snapshot.config)
      : undefined;
    const generatedAt = new Date();
    const calculationNumber = createCalculationNumber(generatedAt);
    const pdfBuffer = await createRkeeperPdf({
      calculation,
      ...(itAdministration ? { itAdministration } : {}),
      calculationNumber,
      generatedAt,
    });
    const fileName = `posadmin-rkeeper-calculation-${calculationNumber}.pdf`;

    return createCalculationPdfResponse(pdfBuffer, fileName);
  } catch (error) {
    return createCalculationPdfErrorResponse(error, "r_keeper");
  }
}
