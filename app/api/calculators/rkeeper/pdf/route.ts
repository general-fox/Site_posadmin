import { NextResponse } from "next/server";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RkeeperPdfRequest = {
  product?: unknown;
  workplaceCount?: unknown;
  selectedAdditionalModules?: unknown;
};

function parseRequest(body: RkeeperPdfRequest) {
  if (body.product !== RKEEPER_PRODUCT_ID) {
    throw new CalculationPdfInputError("Некорректный программный продукт");
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

  return {
    workplaceCount: Number(body.workplaceCount),
    selectedModules: selectedModules as RkeeperAdditionalModuleId[],
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
    const { workplaceCount, selectedModules } = parseRequest(body);
    const calculation = calculateRkeeperPricing(
      workplaceCount,
      selectedModules,
    );
    const generatedAt = new Date();
    const calculationNumber = createCalculationNumber(generatedAt);
    const pdfBuffer = await createRkeeperPdf({
      calculation,
      calculationNumber,
      generatedAt,
    });
    const fileName = `posadmin-rkeeper-calculation-${calculationNumber}.pdf`;

    return createCalculationPdfResponse(pdfBuffer, fileName);
  } catch (error) {
    return createCalculationPdfErrorResponse(error, "r_keeper");
  }
}
