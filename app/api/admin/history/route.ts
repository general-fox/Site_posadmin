import { requireAdminSession } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson } from "@/lib/admin-http";
import { getPricingHistory } from "@/lib/pricing-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    requireAdminSession(request);
    return adminJson({ history: getPricingHistory() });
  } catch (error) { return adminErrorResponse(error); }
}
