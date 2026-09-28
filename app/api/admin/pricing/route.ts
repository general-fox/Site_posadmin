import { revalidatePath } from "next/cache";
import { AdminError, requireAdminSession } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson, readAdminJson } from "@/lib/admin-http";
import { validatePricingConfig } from "@/lib/pricing-config";
import { savePricing } from "@/lib/pricing-store";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const body = await readAdminJson(request);
    const session = requireAdminSession(request);
    const validated = validatePricingConfig(body.config);
    if (!validated.ok) throw new AdminError(400, validated.error);
    if (typeof body.revision !== "number" || !Number.isSafeInteger(body.revision) || body.revision < 0) throw new AdminError(400, "Некорректная версия прайса.");
    const snapshot = savePricing(validated.value, body.revision, session.email);
    revalidatePath("/", "layout");
    return adminJson(snapshot);
  } catch (error) { return adminErrorResponse(error); }
}
