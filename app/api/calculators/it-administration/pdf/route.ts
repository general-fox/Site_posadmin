import { NextResponse } from "next/server";
import {
  calculateItAdministrationPricing,
  isItAdministrationModuleId,
  IT_ADMINISTRATION_PRODUCT_ID,
  type ItAdministrationModuleId,
} from "@/lib/it-administration-pricing";
import {
  CalculationPdfInputError,
  createCalculationNumber,
  createCalculationPdfErrorResponse,
  createCalculationPdfResponse,
  isCalculationPdfRateLimited,
} from "@/lib/calculation-pdf-api";
import { createItAdministrationPdf } from "@/lib/rkeeper-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ItAdministrationPdfRequest = {
  product?: unknown;
  workplaceCount?: unknown;
  selectedModules?: unknown;
};

function parseRequest(body: ItAdministrationPdfRequest) {
  if (body.product !== IT_ADMINISTRATION_PRODUCT_ID) {
    throw new CalculationPdfInputError("Некорректное направление услуг");
  }
  if (
    !Number.isSafeInteger(body.workplaceCount) ||
    Number(body.workplaceCount) < 1 ||
    Number(body.workplaceCount) > 10_000
  ) {
    throw new CalculationPdfInputError(
      "Некорректное количество рабочих мест",
    );
  }
  if (!Array.isArray(body.selectedModules)) {
    throw new CalculationPdfInputError("Некорректный список модулей");
  }

  const selectedModules = body.selectedModules;
  if (
    selectedModules.some(
      (moduleId) =>
        typeof moduleId !== "string" ||
        !isItAdministrationModuleId(moduleId),
    )
  ) {
    throw new CalculationPdfInputError("Модуль не найден");
  }
  if (new Set(selectedModules).size !== selectedModules.length) {
    throw new CalculationPdfInputError("Модуль указан повторно");
  }
  if (selectedModules.length === 0) {
    throw new CalculationPdfInputError("Услуги не выбраны");
  }

  return {
    workplaceCount: Number(body.workplaceCount),
    selectedModules: selectedModules as ItAdministrationModuleId[],
  };
}

export async function POST(request: Request) {
  if (isCalculationPdfRateLimited(request, "it-administration")) {
    return NextResponse.json(
      { message: "Слишком много запросов. Попробуйте немного позже." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as ItAdministrationPdfRequest;
    const { workplaceCount, selectedModules } = parseRequest(body);
    const calculation = calculateItAdministrationPricing(
      workplaceCount,
      selectedModules,
    );
    const generatedAt = new Date();
    const calculationNumber = createCalculationNumber(generatedAt);
    const pdfBuffer = await createItAdministrationPdf({
      calculation,
      calculationNumber,
      generatedAt,
    });
    const fileName =
      `posadmin-it-administration-calculation-${calculationNumber}.pdf`;

    return createCalculationPdfResponse(pdfBuffer, fileName);
  } catch (error) {
    return createCalculationPdfErrorResponse(error, "IT administration");
  }
}
