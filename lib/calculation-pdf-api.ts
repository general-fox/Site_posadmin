import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { CALCULATION_PDF_CONFIG } from "@/lib/calculation-pdf-config";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_REQUESTS = 8;

const globalRateLimit = globalThis as typeof globalThis & {
  calculationPdfRequests?: Map<string, number[]>;
};

const requestLog =
  globalRateLimit.calculationPdfRequests ?? new Map<string, number[]>();
globalRateLimit.calculationPdfRequests = requestLog;

export class CalculationPdfInputError extends Error {}

export function isCalculationPdfRateLimited(
  request: Request,
  calculatorId: string,
) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientId = forwardedFor?.split(",")[0]?.trim() || "local";
  const requestKey = `${calculatorId}:${clientId}`;
  const now = Date.now();
  const activeRequests = (requestLog.get(requestKey) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );

  if (activeRequests.length >= RATE_LIMIT_REQUESTS) {
    requestLog.set(requestKey, activeRequests);
    return true;
  }

  activeRequests.push(now);
  requestLog.set(requestKey, activeRequests);
  return false;
}

export function createCalculationNumber(date: Date) {
  const year = new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(date);
  const sequence = String(randomInt(1, 100_000)).padStart(5, "0");

  return [CALCULATION_PDF_CONFIG.calculationPrefix, year, sequence]
    .filter(Boolean)
    .join("-");
}

export function createCalculationPdfResponse(
  pdfBuffer: Buffer,
  fileName: string,
) {
  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(pdfBuffer.length),
      "Content-Type": "application/pdf",
    },
  });
}

export function createCalculationPdfErrorResponse(
  error: unknown,
  calculatorLabel: string,
) {
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      { message: "Некорректный запрос" },
      { status: 400 },
    );
  }
  if (error instanceof CalculationPdfInputError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  console.error(`Failed to generate ${calculatorLabel} PDF`, error);
  return NextResponse.json(
    { message: "Не удалось сформировать PDF. Попробуйте ещё раз." },
    { status: 500 },
  );
}
