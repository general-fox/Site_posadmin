import { NextResponse } from "next/server";
import { getPricingSnapshot } from "@/lib/pricing-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(getPricingSnapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Не удалось получить актуальный прайс." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
